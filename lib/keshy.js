var http = require('http');
var util = require('util');
var utils = require('./utils.js');
var phantom = require('phantom');
var Buffer = require('buffer');
var fs = require('fs');

var loadedExtractors = {}
function createServer(){
var keshy = new KeshyServer();
   var server = http.createServer(function(req, res) {
      keshy.handleHttpRequest(req, res);
   });
   
   // Must explicitly handle upgrade
   server.on('upgrade', function (req, socket, head) {
     res = new http.ServerResponse(req);
     res.assignSocket(socket);
     keshy.handleHttpRequest(req, res);
   });
   return server;
}
exports.createServer = createServer;



function KeshyServer() {
    this.handlers = {
            'extract' : onExtractRequest,
    };
};
exports.KeshyServer = KeshyServer;

KeshyServer.prototype.handleHttpRequest = function(req, res) {
    console.log("Handling request for "+req.url);
    
    // Get the target URL for the request
    var targetUrl = utils.targetUrl(req);
    console.log("Request target URL: " + targetUrl.href);
    
    this.handlerFor(targetUrl).call(null, req, res, targetUrl, this.handled);
};

KeshyServer.prototype.handlerFor = function(targetUrl) {
    
    var handler = this.handlers[targetUrl.handler];
    if (handler) { 
        return handler;
    }

    return function(req, res, targetUrl, callback) {
        util.debug("No handler found for "+targetUrl.href);
        res.writeHead(404);
        res.end("No handler was found for the requested resource.");
    };

};

KeshyServer.prototype.handled = function(e, req, res, targetUrl) {
    if (e) {
        console.trace("Error in handler: "+e.message);
        var msg = e.message + '\n' + e.stack;
		res.writeHeader(500, {'Content-Type':'text/javascript'});
		res.end(e.message);
		
    } else {
		util.debug("Completed request: "+req.url);
    }
};

function onExtractRequest(req, res, targetUrl, callback){
	url = targetUrl.href;
	// get the extractor for the given URL. 
	var ex = utils.extractorFor(url);
	if(ex == null){
		res.writeHead(200, {'Content-Type': 'text/javascript' });
		res.end('No extractor found for given url');
		return;
	} else {
		var xtor = require(ex).extractor;
		if(!xtor.canParse){
			var e= {}
			e.message = "Cannot use existing parser registered with hostname: " + xtor.hostname + " for this url.";
			callback(e, req, response, targetUrl);
			return;
		}
	}
	
	// use phantom module to perform DOM manipulation.
	return phantom.create(function(ph) {
	  return ph.createPage(function(page) {
	 
			return parseDOM(page, url, xtor, function(err, response){
				if(err){
					var e = {}
					e.message = err;
					callback(e, req, res, targetUrl);				
					return;
				}
				else {
					if(response){
						res.writeHeader(200, {'Content-Type':'application/json'});
						res.write(response);
						res.end();
						callback(null, req, res, targetUrl);
						return;
					}
				}
			});
			
		});
	});

}

// dedicated DOM parser - wrapper for document.evaluate
function parseDOM(page, url, xtor, callback){
	t = Date.now();
	page.set('settings.loadImages', true);
	page.set('settings.javascriptEnabled', true);
	page.set('settings.localToRemoteUrlAccessEnabled', true);
	
	page.open(url, function(status){
	
		if (status !== 'success') {
			callback('cannot open page', null);
			return;
		} 	
		else 
		{	
		t = Date.now() - t;
		console.log('Loading time ' + t + ' msec');
		// capture snapshot of the webpage.
		page.render('img/snapshot.jpg');		
		
		return page.evaluate(evaluateWithArgs(function(extractor) {
			var links = [];
			var items = document.evaluate(extractor.selectXP, document, null, 7, null);
			
			var i = 0; 
			// local xpath lookup 
			// firebug XPath construction logic
			// http://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js#1333
			function getXpath(node){
				if(node && node.id){
					return '//*[@id="' + node.id + '"]';
				}
				else {
					var paths = [];
					var temp = node.parentNode;
					while( temp && temp.nodeType == 1){
						var index = 0;
						var sibling = temp.previousSibling;
						while(sibling) {
							// Ignore document type declaration.
							if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE){
								sibling = sibling.previousSibling;
								continue;
							}
								
							if (sibling.nodeName == temp.nodeName) {
								index = index + 1;
							}
							sibling = sibling.previousSibling;
						}
						var tagName = temp.nodeName.toLowerCase();
						var pathIndex = (index ? "[" + (index+1) + "]" : "");
						paths.splice(0, 0, tagName + pathIndex);
						temp = temp.parentNode;
					}
					
					return paths.length ? "/" + paths.join("/") : null;
					
				}
			}
			
			for(i=0; i<items.snapshotLength; i++){
				node = items.snapshotItem(i);
				xpath = {}
					
				var href = document.evaluate(extractor.hrefXP, node, null, 7, null);
				var hrefText;
				var thumb = document.evaluate(extractor.thumbXP, node, null, 7, null);
				
				if(href.snapshotLength == 1 && thumb.snapshotLength == 1){
					hrefText = href.snapshotItem(0).nodeValue;
					xpath.thumbXpath = getXpath(thumb.snapshotItem(0));
					xpath.nodeXpath = getXpath(node.parentNode);
					var res = {};
					res.xpath = xpath;
					res.url = extractor.base + hrefText;
					
					links.push(res);      
				}
			}   
			return links;			
		}, xtor),function(result){
			
			if(utils.isEmpty(result)){
				callback('no media items were identified', null);
				return;
			}
			return getOEmbedData(xtor, result, function(err, response){
				if(err){
					callback('error fetching oembed metadata', null);
					return;
				}
				if(response) {
					callback(null,  utils.encode(response));
					return;
				}
		    });
		});					
		}
	});
};
// prototype beam button injection
KeshyServer.prototype.decoratePageWithBeam = function(page, status){
// code to beam content.


};

// returns oEmbed data for individual content items. 
function getOEmbedData(extractor, links, callback){
	
	if(links.length == 0){
		callback('empty list of links', null);
		return;
	}
	
	var result = [];
	util.debug("fetching metadata for " + links.length + " identified resources...");
	

		var options = {
		}
	for(var i in links){
		var arr = links[i];
		if(arr){
			// closure function to maintain local copy of object
			(function(arr){
				http.get(extractor.oembed + arr.url, function(response){
				var oembed = '';
				
				// look at response headers..
				response.on('data', function(chunk){
					oembed+=chunk;
				});
				response.on('end', function(){
					var temp = {};
					temp.version = '1.0';
					temp.serialized = 'true';
					temp.url = arr.url;
					temp.element = arr.xpath.nodeXpath;
					temp.thumbnail = arr.xpath.thumbXpath;
					if(temp.thumbnail.startsWith(temp.element)){
							temp.thumbnail = temp.thumbnail.substring(temp.element.length, arr.xpath.thumbXpath.length);
					}
					try{
						temp.oembed = JSON.parse(oembed);
						
					}catch(err){
						util.debug("errror: url=" + arr.url + " errorMessage:" + err + " oEmbed data:" + oembed);
					}
					
					result.push(temp);
					if(result.length == links.length){
					   callback(null, result);
					   return;		
					}
				});
			});
		})(arr);
			
		}
	}
}

// Hack to override page.evaluate to take in arguments defined out of page scope
function evaluateWithArgs(fn) {
    return "function() { return (" + fn.toString() + ").apply(this, " + JSON.stringify(Array.prototype.slice.call(arguments, 1)) + ");}";
}


  


	