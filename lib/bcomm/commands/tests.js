
var BCOMM = require("bcomm");
var stream = require("narwhal/term").stream;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("list all available tests");
parser.helpful();

parser.action(function (options) {
    var response = BCOMM.request("tests");
    response.forEach(function(test) {
        stream.print(BCOMM.coloredID(test.testID) + ": " + test.name);
    });
});
