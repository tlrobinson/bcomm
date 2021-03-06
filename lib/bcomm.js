var UTIL = require("narwhal/util");
var HTTP = require("http");
var FILE = require("file");
var SYSTEM = require("system");

var stream = require("narwhal/term").stream;
var Request = require("jack/request").Request;
var Response = require("jack/response").Response;

exports.packagePath = FILE.path(module.path).join("..", "..");
exports.dataPath = exports.packagePath.join("bcomm-data");

exports.configPath = exports.dataPath.join("config.json");

var BCOMM = exports;

var CORE = require("./bcomm/core");

var clientID = null;
exports.clientID = function() {
    if (!clientID)
        clientID = exports.config().client.id;
    return clientID;
}

exports.serverURL = function() {
    return exports.config().server.url;
}

exports.config = function(callback) {
    var config;
    var result;
    try {
        // load or create config
        if (exports.configPath.isFile()) {
            config = JSON.parse(exports.configPath.read({ charset : "UTF-8" }));
        } else {
            config = {
                client : { id : exports.generateID() },
                server : { url : "http://localhost:8080/" }
            };
        }
        // call the callback if provided, otherwise return the config
        if (callback)
            result = callback(config);
        else
            result = config;
    } finally {
        // write out the configuration
        if (config) {
            exports.configPath.dirname().mkdirs();
            exports.configPath.write(JSON.stringify(config, null, 2));
        }
    }
    return result;
}

exports.generateID = function() {
    return Math.round(Math.random() * Math.pow(2, 32)).toString(16).substring(0,6)
}

exports.request = function(name, request, options) {
    request = request || {};
    options = options || {};
    var method  = options.method || (options.block ? "POST" : "GET");
    var headers = options.headers || {};
    
    request.clientID = exports.clientID();
    
    var params = JSON.stringify(request);
    
    var url = exports.serverURL() + name + "?"+encodeURIComponent(params);

    if (SYSTEM.env["DEBUG"]) stream.print("\0blue(=>\0) request = "+params);

    var httpReq = HTTP.open(url, "b", {
        method : method,
        headers : headers
    });
    
    if (options.block)
        options.block(httpReq);
    
    var text = httpReq.read().decodeToString("UTF-8");
    
    if (SYSTEM.env["DEBUG"]) stream.print("\0blue(<=\0) response = "+text);

    var response = JSON.parse(text);

    return response;
}

exports.printResponse = function(response) {
    switch (response.type) {
        case "error":
            stream.print(BCOMM.coloredID(response.runnerID) + ": \0red(" + UTIL.repr(response.error) + "\0)");
            break;

        case "console":
            stream.print(BCOMM.coloredID(response.runnerID) + ": \0yellow(console."+response.console.level+"(" +
                UTIL.repr(response.console.args).slice(1,-1)+")\0)");
            break;

        case "value":
            var string = "undefined";
            if (typeof response.value !== "undefined")
                string = UTIL.repr(response.value);
            else if (typeof response.valueString !== "undefined")
                string = response.valueString;
            stream.print(BCOMM.coloredID(response.runnerID) + ": " + string);
            break;

        default :
            stream.print(BCOMM.coloredID(response.runnerID) + ": " + UTIL.repr(response));
            break;
    }
}

exports.JSONApp = function(app) {
    return function(env) {
        
        CORE.flushTimeouts();
        
        // print(env["QUERY_STRING"])
        // print(decodeURIComponent(env["QUERY_STRING"]))
        
        var body = null;
        if (env["QUERY_STRING"])
            body = decodeURIComponent(env["QUERY_STRING"]);
        else if (env["REQUEST_METHOD"] === "POST")
            body = env["jsgi.input"].read().decodeToString("UTF-8");
        
        var requestObject = {};
        if (body)
            requestObject = JSON.parse(body);
            
        stream.print("\0purple(=>\0) request = "+JSON.stringify(requestObject));
        
        var responseObject = app(requestObject, env) || {};

        stream.print("\0purple(<=\0) response = "+JSON.stringify(responseObject));
        stream.print(Array(81).join("="));

        var response = Response.json(responseObject);

        return response;
    }
}

var colors = ["red", "yellow", "green", "blue", "cyan", "magenta"];
exports.colorForID = function(id) {
    return colors[parseInt(id, 16) % colors.length];
}

exports.coloredID = function(id) {
    return id.match(/.{6}/g).map(function(c) { return "\0" + exports.colorForID(c)+"("+c+"\0)"; }).join("");
    // return "\0" + exports.colorForID(id) + "(" + id + "\0)";
}
