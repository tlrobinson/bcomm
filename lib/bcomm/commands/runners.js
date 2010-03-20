
var BCOMM = require("bcomm");
var stream = require("term").stream;

var parser = exports.parser = new (require("args").Parser)();
parser.help("list all available runners");
parser.helpful();

parser.action(function (options) {
    var response = BCOMM.request("runners");
    response.forEach(function(runner) {
        stream.print(BCOMM.coloredID(runner.runnerID) + ": " +
            runner.browser + " " + runner.version + " (" + runner.os + ")" +
            " => " + runner.location);
    });
});
