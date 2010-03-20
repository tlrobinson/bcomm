
var UTIL = require("util");
var OS = require("os");
var SYSTEM = require("system");

var BCOMM = require("bcomm");
var stream = require("term").stream;
var readline = require("readline").readline;

var parser = exports.parser = new (require("args").Parser)();
parser.help("run a test");

parser.option('-r', 'runners')
    .push()
    .help("select a runner (multiple allowed)");

parser.option('-e', 'eval')
    .set()
    .help("select a runner (multiple allowed)");

parser.option('-n', 'noAutoComplete')
    .set(true)
    .help("disable auto-completion of task");

parser.helpful();

parser.action(function (options) {
    if (options.eval) {
        exports.evaluate(options.eval, options.runners, options);
    } else {
        while (true) {
            exports.evaluate(readline("> "), options.runners, options);
        }
    }
});

exports.evaluate = function(command, runners, options) {
    var taskIDs = BCOMM.request("eval", {
        command : command,
        runners : runners,
        noAutoComplete : options.noAutoComplete
    });
    
    while (taskIDs.length > 0) {
        var responses = BCOMM.request("task-responses", { taskIDs : taskIDs });
        
        responses.forEach(function(response) {
            BCOMM.printResponse(response);
            if (response.complete)
                taskIDs = taskIDs.filter(function(taskID) { return taskID !== response.taskID });
        });
        
        if (taskIDs.length > 0)
            OS.sleep(1.0);
    }
}
