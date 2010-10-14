
var BCOMM = require("bcomm");
var stream = require("narwhal/term").stream;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("list all available runners");

require("../runner-params").addRunnerSelectionParams(parser);

parser.helpful();

parser.action(function (options) {
print(JSON.stringify(options))
    var response = BCOMM.request("runners");
    response.forEach(function(runner) {
        stream.print(BCOMM.coloredID(runner.runnerID) + ": " +
            runner.browser + " " + runner.version + " (" + runner.os + ")" +
            " => " + runner.location);
    });
});
