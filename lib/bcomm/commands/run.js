
var BCOMM = require("bcomm");
var OS = require("os");

var stream = require("narwhal/term").stream;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.usage("[test1 [test2 [...]]]")
parser.help("Run a test. If no tests are specified, run the last uploaded test.");

require("../runner-params").addRunnerSelectionParams(parser);

parser.helpful();

parser.action(function (options) {
    var tests = options.args.length > 0 ? options.args : [BCOMM.config()["lastUploadedTestID"]];
    print("Running tests: " + tests.join(", "));
    var taskIDs = BCOMM.request("run", {
        runnerIDs : options.runnerIDs,
        tests : tests
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
