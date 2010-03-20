var BCOMM = {};

BCOMM.runnerPollPeriod = 500;

BCOMM.request = function(name, request, options, callback) {
    request = request || {};
    options = options || {};
    options.method = options.method || "GET";
    
    request.runnerID = runnerID;
    request.browser = BrowserDetect.browser;
    request.version = BrowserDetect.version;
    request.os = BrowserDetect.OS;
    request.location = String(window.location);
    
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 200) {
                if (callback)
                    callback(JSON.parse(req.responseText))
            }
            else {
                console.error("Error: " + req.status);
            }
        }
    }
    
    req.open(options.method, "/"+name+"?"+encodeURIComponent(JSON.stringify(request)), false);
    
    if (options.callback) {
        options.callback(req);
    } else {    
        req.send();
    }
}

BCOMM.generateID = function() {
    return Math.round(Math.random() * Math.pow(2, 32)).toString(16).substring(0,6)
}

var runnerID = BCOMM.generateID();

var taskID = null;
var taskResponses = [];

function emitResponse(response) {
    response.taskID = taskID;
    taskResponses.push(response);
    if (response.complete)
        taskID = null;
}

function completeTask() {
    emitResponse({ complete : true });
}

function runTasks(request) {
    var task = request.task;
    if (!task)
        return;

    taskID = task.taskID;
    
    if (task.eval) {
        try {
            var value = eval(task.eval);
            emitResponse({
                value : value,
                complete : !task.noAutoComplete
            });
        } catch (error) {
            emitResponse({
                error : error,
                complete : true
            });
        }
    }
}

function init() {
    installHooks(window);
    
    window.setInterval(function() {
        var request = {
            ready : !taskID,
            responses : taskResponses
        };
        taskResponses = [];
        BCOMM.request("runner-poll", request, null, runTasks);
        
    }, BCOMM.runnerPollPeriod);
}

function installHooks(_window) {
    var consoleOriginal = _window.console;
    _window.console = {};
    ["log", "debug", "error", "info", "warn", "trace"].forEach(function(level) {
        _window.console[level] = function() {
            if (consoleOriginal)
                consoleOriginal[level].apply(consoleOriginal, arguments);

            emitResponse({
                console : {
                    level : level,
                    args : Array.prototype.slice.call(arguments)
                }
            });
        }
    });
}
