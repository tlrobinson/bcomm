var FILE = require("file");
var UTIL = require("narwhal/util");
var ZIP = require("zip");
var stream = require("narwhal/term").stream;

var BCOMM = require("bcomm");
var CORE = require("./core");

var JSONApp = BCOMM.JSONApp;

var routes = exports.routes = {};

var staticPath = BCOMM.packagePath.join("static");
routes["/static"] = require("jack/file").File(staticPath.toString());


routes["/"] = require("jack/redirect").Redirect("static/dispatcher.html");

routes["/runner-poll"] = JSONApp(function(request, env) {
    var runner = CORE.getRunner(request.runnerID)
    if (!runner) {
        request.userAgent = env["HTTP_USER_AGENT"];
        runner = CORE.addRunner(request);
    }
    runner.lastPoll = new Date();

    if (request.responses) {
        request.responses.forEach(function(response) {
            response.runnerID = request.runnerID;

            CORE.addResponse(response);
        });
    }

    // get the next task if the runner is ready for one, or there's a high priority task
    for (var i = 0; runner.queue && i < runner.queue.length; i++) {
        var taskID = runner.queue[i];
        var task = CORE.getTask(taskID);
        if (request.ready || task.priority) {
            runner.queue.splice(i, 1);
            return { task : task };
        }
    }
});

routes["/task-send"] = JSONApp(function(request) {
    var taskIDs = [];

    CORE.runnersForRequest(request).forEach(function(runner) {
        taskIDs.push(CORE.addTask(runner, request.task));
    });
    return taskIDs;
});

routes["/task-responses"] = JSONApp(function(request) {
    var responses = [];

    request.taskIDs.map(CORE.getTask).forEach(function(task) {
        if (task.responses.length > 0) {
            responses = responses.concat(task.responses);
            task.responses = [];
        }
    });

    return responses;
});

routes["/runner-responses"] = JSONApp(function(request) {
    var responses = [];

    CORE.runnersForRequest(request).forEach(function(runner) {
        if (runner.responses.length > 0) {
            responses = responses.concat(runner.responses);
            runner.responses = [];
        }
    });

    return responses;
});

routes["/runners"] = JSONApp(function(request) {
    return CORE.getRunners();
});

require("./server/tests");
