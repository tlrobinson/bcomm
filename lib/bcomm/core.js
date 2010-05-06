var UTIL = require("util");
var BCOMM = require("bcomm");

var TIMEOUT = 10*1000; // 10s

var runnersForRequest = exports.runnersForRequest = function(request) {
    return (request.runnerIDs && request.runnerIDs.length > 0) ? request.runnerIDs.map(getRunner) : getRunners();
}

var tasks = {};
var addTask = exports.addTask = function(runner, task) {
    if (!runner.queue)
        runner.queue = [];

    task = UTIL.deepCopy(task);
    
    task.created = new Date();
    task.taskID = BCOMM.generateID();
    task.runnerID = runner.runnerID;
    task.responses = [];

    tasks[task.taskID] = task;

    runner.queue.push(task.taskID);

    return task.taskID;
}

var addResponse = exports.addResponse = function(response) {
    if (response.taskID) {
        var task = getTask(response.taskID);
        task.responses.push(response);
    }

    var runner = getRunner(response.runnerID);
    runner.responses.push(response);
}

var getTask = exports.getTask = function(taskID) {
    return tasks[taskID];
}

var runners = {};
var addRunner = exports.addRunner = function(request) {
    var runner = UTIL.deepCopy(request);

    runner.created = new Date();
    runner.responses = [];

    runners[runner.runnerID] = runner;

    return runner;
}

var getRunner = exports.getRunner = function(runnerID) {
    return runners[runnerID];
}

var getRunnerIDs = exports.getRunnerIDs = function() {
    return Object.keys(runners);
}

var getRunners = exports.getRunners = function() {
    return getRunnerIDs().map(function(runnerID) { return getRunner(runnerID); });
}

var deleteRunner = exports.deleteRunner = function(runnerID) {
    delete runners[runnerID];
}

var flushTimeouts = exports.flushTimeouts = function() {
    var now = new Date();
    getRunners().forEach(function(runner) {
        if (runner.lastPoll.getTime() < now.getTime() - TIMEOUT) {
            print("Timing out runner " + runner.runnerID);
            deleteRunner(runner.runnerID);
        }
    });
};
