
var BCOMM = require("bcomm");
var OS = require("os");

var stream = require("narwhal/term").stream;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("run a test");

require("../runner-params").addRunnerSelectionParams(parser);

parser.option('-r', 'runners')
    .push()
    .help("select a runner (multiple allowed)");

parser.helpful();

parser.action(function (options) {
    var taskIDs = BCOMM.request("run", {
        runners : options.runners,
        tests : options.args
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
        if (taskIDs.length > 0 && options.timeout > 0 && elapsed > 60 * 1000) {
            stream.print("\0red(Warning: tasks " + taskIDs.join(", ") + " timed out\0)");
            break;
        }

        if (taskIDs.length > 0)
            OS.sleep(0.5);
    }
});
