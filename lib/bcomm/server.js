var FILE = require("file");
var UTIL = require("util");
var ZIP = require("zip");
var stream = require("term").stream;

var BCOMM = require("bcomm");
var JSONApp = BCOMM.JSONApp;

var TIMEOUT = 10*1000; // 10s

var staticPath = BCOMM.packagePath.join("static");
exports["/static"] = require("jack/file").File(staticPath.toString());


exports["/"] = require("jack/redirect").Redirect("static/dispatcher.html");

exports["/runner-poll"] = JSONApp(function(request, env) {
    var runner = getRunner(request.runnerID)
    if (!runner) {
        request.userAgent = env["HTTP_USER_AGENT"];
        runner = addRunner(request);
    }
    runner.lastPoll = new Date();

    timeoutRunners();

    if (request.responses) {
        request.responses.forEach(function(response) {
            response.runnerID = request.runnerID;

            addResponse(response);
        });
    }

    if (request.ready) {
        if (runner.queue && runner.queue.length) {
            var taskID = runner.queue.pop();
            var task = getTask(taskID);
            return { task : task };
        }
    }
    
});

exports["/task-send"] = JSONApp(function(request) {
    timeoutRunners();

    var taskIDs = [];

    runnersForRequest(request).forEach(function(runner) {
        taskIDs.push(addTask(runner, request.task));
    });
    return taskIDs;
});

exports["/task-responses"] = JSONApp(function(request) {
    timeoutRunners();

    var responses = [];

    request.taskIDs.map(getTask).forEach(function(task) {
        if (task.responses.length > 0) {
            responses = responses.concat(task.responses);
            task.responses = [];
        }
    });

    return responses;
});

exports["/runner-responses"] = JSONApp(function(request) {
    timeoutRunners();

    var responses = [];

    runnersForRequest(request).forEach(function(runner) {
        if (runner.responses.length > 0) {
            responses = responses.concat(runner.responses);
            runner.responses = [];
        }
    });

    return responses;
});

exports["/runners"] = JSONApp(function(request) {
    timeoutRunners();

    return getRunners();
});

var testCommands = require("./server/tests");
for (var path in testCommands)
    exports[path] = testCommands[path];

function runnersForRequest(request) {
    return (request.runnerIDs && request.runnerIDs.length > 0) ? request.runnerIDs.map(getRunner) : getRunners();
}

var tasks = {};
function addTask(runner, task) {
    if (!runner.queue)
        runner.queue = [];

    task = UTIL.deepCopy(task);

    task.taskID = BCOMM.generateID();
    task.runnerID = runner.runnerID;
    task.responses = [];

    tasks[task.taskID] = task;

    runner.queue.push(task.taskID);

    return task.taskID;
}

function addResponse(response) {
    if (response.taskID) {
        var task = getTask(response.taskID);
        task.responses.push(response);
    }

    var runner = getRunner(response.runnerID);
    runner.responses.push(response);
}

function getTask(taskID) {
    return tasks[taskID];
}

var runners = {};
function addRunner(request) {
    var runner = UTIL.deepCopy(request);

    runner.created = new Date();
    runner.responses = [];

    runners[runner.runnerID] = runner;

    return runner;
}

function getRunner(runnerID) {
    return runners[runnerID];
}

function getRunnerIDs() {
    return Object.keys(runners);
}

function getRunners() {
    return getRunnerIDs().map(function(runnerID) { return getRunner(runnerID); });
}

function deleteRunner(runnerID) {
    delete runners[runnerID];
}

function timeoutRunners() {
    var now = new Date();
    getRunners().forEach(function(runner) {
        if (runner.lastPoll.getTime() < now.getTime() - TIMEOUT) {
            print("Timing out runner " + runner.runnerID);
            deleteRunner(runner.runnerID);
        }
    });
};
