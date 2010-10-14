
var BCOMM = require("bcomm");
var OS = require("os");

var stream = require("narwhal/term").stream;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("resets the selected runner(s)");

parser.option("-m", "--migrate", "url")
    .set()
    .help("migrate to a different server");

require("../runner-params").addRunnerSelectionParams(parser);

parser.helpful();

parser.action(function (options) {
    var taskIDs = BCOMM.request("task-send", {
        runnerIDs : options.runnerIDs,
        task : {
            type : "reset",
            url : options.url,
            priority : 1
        }
    });
    if (options.url) {
        BCOMM.config(function(config) {
            config.server.url = options.url
        });
    }
});
