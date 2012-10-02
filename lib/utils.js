var parseUrl = require('url').parse;

// add startsWith to String prototype
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}

function http_targetUrl(req) {
   var path = req.url;
   
   // Otherwise, assume path is of the form /handler/host/path
   paths = path.substring(1).split('/');
   if(paths.length == 0){
		return null;
   }
      
   var targetUrl = parseUrl('http://' + paths.slice(1).join('/'));
   targetUrl.handler = paths[0];
   return targetUrl;
}
exports.targetUrl = http_targetUrl;


function startsWith(str, sub){
	return str.indexOf(sub) == 0;
}
exports.startsWith = startsWith;

function getExtractorFor(url){
    var supportedSites = [
    ['youtube.com', './youtube_desktop_extractor'],
    //'break.com', 
    //'metacafe.com', 
    //'vimeo.com', 
    //'funnyordie.com', 
];
    HOST = /^(\w+\.)+\w+$/;
    NAME = /^\w+$/;
     
    for (var i in supportedSites) {
        var key = supportedSites[i][0];
        var escKey = key.replace(".", "\\.");
        var regex;
         
        if (key.match(HOST)) {
            regex = RegExp("^https?:\/\/(\\w+\\.)*"+escKey+"\\/.*", "i");
        } else if (key.match(NAME)) {
            regex = RegExp("^https?:\/\/(\\w+\\.)*"+escKey+"\\.\\w+\\/.*", "i");
        } else {
            regex = RegExp("^.*"+escKey+".*");
        }
         
        supportedSites[i][0] = regex;
    }
     
    // use the right parser based on page url.
    for (var i in supportedSites) {
        regex = supportedSites[i][0];
        if (regex.test(url)) {
            console.log("loading parser: " + supportedSites[i][1]);
            return supportedSites[i][1];
        }
    }
	return null;
}

exports.extractorFor = getExtractorFor;

function strencode( data ) {
  return unescape( encodeURIComponent( JSON.stringify( data ) ) );
}
exports.encode = strencode;

function strdecode( data ) {
  return JSON.parse( decodeURIComponent( escape ( data ) ) );
}
exports.decode = strdecode;

function isEmpty(data){
	return (data == null || data.length == 0)? true : false;
}
exports.isEmpty = isEmpty;

function lang_toArray(o) {
   if (o === null) return new Array();
   if (typeof o === 'object' && typeof o.length !== 'undefined') return o;
   return new Array(o);
}
exports.toArray = lang_toArray;
