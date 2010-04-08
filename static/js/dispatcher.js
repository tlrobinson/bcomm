var BCOMM = {};

BCOMM.runnerPollPeriod = 500;

BCOMM.xhr = function() {
    if (typeof ActiveXObject === "function")
        return new ActiveXObject("Microsoft.XMLHTTP");
    if (typeof XMLHttpRequest !== "undefined")
        return new XMLHttpRequest();
    throw new Error("Missing XMLHttpRequest");
}

BCOMM.request = function(name, request, options, callback) {
    request = request || {};
    options = options || {};
    options.method = options.method || "GET";

    request.runnerID = runnerID;
    request.browser = BrowserDetect.browser;
    request.version = BrowserDetect.version;
    request.os = BrowserDetect.OS;
    request.location = String(window.location);

    var req = BCOMM.xhr();
    req.open(options.method, "/"+name+"?"+encodeURIComponent(JSON.stringify(request)), true);
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

    if (options.callback) {
        options.callback(req);
    } else {
        req.send();
    }

    return req;
}

BCOMM.generateID = function() {
    return Math.round(Math.random() * Math.pow(2, 32)).toString(16).substring(0,6)
}

BCOMM.commands = {};

BCOMM.commands.eval = function(task) {
    try {
        var value = eval(task.command);

        var response = {
            type : "value",
            complete : !task.noAutoComplete
        }

        response.valueString = String(value);

        // only set the value property if we can successfully serialize it
        try {
            JSON.stringify(value);
            response.value = value;
        } catch (e) {
        }

        emitResponse(response);
    } catch (error) {
        emitResponse({
            type : "error",
            error : error,
            complete : true
        });
    }
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

function dispatchTask(request) {
    var task = request.task;
    if (!task)
        return;

    // use taskID as a sort of lock
    taskID = task.taskID;

    var command = BCOMM.commands[task.type];
    if (command) {
        command(task);
    }
    else {
        console.log("command type " + task.type + " not found");
    }
}

function poll() {
    var request = {
        ready : !taskID,
        responses : taskResponses
    };
    taskResponses = [];

    BCOMM.request("runner-poll", request, null, dispatchTask);
}

function init() {
    installHooks(window);

    window.setTimeout(function() {
        emitResponse({
            type: "connected",
            connected : true
        });
    }, 0);

    function unloadHandler() {
        emitResponse({
            type: "disconnected",
            connected : false
        });
        poll();
    }

    if (window.attachEvent) {
        window.attachEvent("onunload", unloadHandler);
    } else {
        window.addEventListener("unload", unloadHandler, false);
    }

    window.setInterval(poll, BCOMM.runnerPollPeriod);
}

function installHooks(_window) {
    if (!_window.console)
        _window.console = {};
    var levels = ["log", "debug", "error", "info", "warn", "trace"];
    for (var i = 0; i < levels.length; i++) {
        (function(level) {
            var original = _window.console[level];
            _window.console[level] = function() {
                if (typeof original === "function")
                    original.apply(_window.console, arguments);

                emitResponse({
                    type : "console",
                    console : {
                        level : level,
                        args : Array.prototype.slice.call(arguments)
                    }
                });
            }
        })(levels[i]);
    };
}
