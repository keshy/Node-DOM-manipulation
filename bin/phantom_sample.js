var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log(msg);
};
function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var str = 'function() { return (' + func.toString() + ')(';
    for (var i = 0, l = args.length; i < l; i++) {
        var arg = args[i];
        if (/object|string/.test(typeof arg)) {
            str += 'JSON.parse(\'' + JSON.stringify(arg) + '\'),';
        } else {
            str += arg + ',';
        }
    }
    str = str.replace(/,$/, '); }');
    return page.evaluate(str);
}

var func = function() {
    console.log('hello, ' + document.title + '\n');
    for (var i = 0, l = arguments.length; i < l; i++) {
        var arg = arguments[i];
        console.log(typeof arg + ':\t' + arg);
    }
};
page.onLoadFinished = function() {
    evaluate(page, func, true, 0, 'string', [0,1,2], {a:0}, function(){}, undefined, null);
    phantom.exit(0);
};
page.open('http://www.google.com/');