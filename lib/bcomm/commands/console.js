
var BCOMM = require("bcomm");

var UTIL = require("util");
var OS = require("os");
var SYSTEM = require("system");

var stream = require("term").stream;
var readline = require("readline").readline;

var parser = exports.parser = new (require("args").Parser)();
parser.help("run a test");

require("../runner-params").addRunnerSelectionParams(parser);

parser.option("-e", "eval")
    .set()
    .help("select a runner (multiple allowed)");

parser.option("-n", "noAutoComplete")
    .set(true)
    .help("disable auto-completion of task");

parser.option("-t", "--timeout", "timeout")
    .natural()
    .def(5)
    .help("timeout period, in seconds, or 0 for no timeout (default 5)");

parser.helpful();

parser.action(function (options) {
    if (options.eval) {
        exports.evaluate(options.eval, options.runnerIDs, options);
    } else {
        while (true) {
            exports.evaluate(readline("> "), options.runnerIDs, options);
        }
    }
});

exports.evaluate = function(command, runnerIDs, options) {
    var taskIDs = BCOMM.request("task-send", {
        runnerIDs : runnerIDs,
        task : {
            type : "eval",
            command : command,
            noAutoComplete : options.noAutoComplete
        }
    });

    var start = new Date();

    while (taskIDs.length > 0) {
        var responses = BCOMM.request("task-responses", { taskIDs : taskIDs });

        responses.forEach(function(response) {
                BCOMM.printResponse(response);
            if (response.complete)
                taskIDs = taskIDs.filter(function(taskID) { return taskID !== response.taskID });
        });

        var elapsed = new Date() - start;
        if (taskIDs.length > 0 && options.timeout > 0 && elapsed > options.timeout * 1000) {
            stream.print("\0red(Warning: tasks " + taskIDs.join(", ") + " timed out\0)");
            break;
        }

        if (taskIDs.length > 0)
            OS.sleep(0.5);
    }
}
