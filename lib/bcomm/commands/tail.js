
var UTIL = require("util");
var OS = require("os");
var SYSTEM = require("system");

var BCOMM = require("bcomm");
var stream = require("term").stream;
var readline = require("readline").readline;

var parser = exports.parser = new (require("args").Parser)();
parser.help("print responses from runners not belonging to any task");

require("../runner-params").addRunnerSelectionParams(parser);

parser.helpful();

parser.action(function (options) {
    while (true) {
        var responses = BCOMM.request("runner-responses", { runnerIDs : options.runners });
        responses.forEach(BCOMM.printResponse);
        OS.sleep(1);
    }
});
