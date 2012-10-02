if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(function (require, exports, module) {   
   //var ua = require('userAgents');
   var SELECTOR_XPATH = "//span[contains(@class, 'video-thumb')]";
   var HREF_XPATH = "ancestor::*/a/@href[contains(.,'/watch')]";
   var THUMB_XPATH = ".//img";
   
   var ytDesktop = {}
   ytDesktop.selectXP = SELECTOR_XPATH;
   ytDesktop.hrefXP = HREF_XPATH;
   ytDesktop.thumbXP = THUMB_XPATH;
   ytDesktop.hostname = /.*\.youtube\.com/;
   ytDesktop.oembed = "http://www.youtube.com/oembed?url=";
   ytDesktop.base = "http://www.youtube.com"
   
   ytDesktop.canParse = function(href, itemType, userAgent) {
      //return itemType == iExtract.VIDEO && ua.parse(userAgent).isDesktop();
      return true;
   };
   
   exports.extractor = ytDesktop;

});