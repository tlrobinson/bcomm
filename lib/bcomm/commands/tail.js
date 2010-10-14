
var UTIL = require("narwhal/util");
var OS = require("os");
var SYSTEM = require("system");

var BCOMM = require("bcomm");
var stream = require("narwhal/term").stream;
var readline = require("readline").readline;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("print responses from runners not belonging to any task");

require("../runner-params").addRunnerSelectionParams(parser);

parser.helpful();

parser.action(function (options) {
    while (true) {
        try {
            var responses = BCOMM.request("runner-responses", { runnerIDs : options.runnerIDs });
            responses.forEach(BCOMM.printResponse);
        } catch (e) {
            print(e);
        }
        OS.sleep(1);
    }
});
