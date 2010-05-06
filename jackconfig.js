var FILE = require("file");

var URLMap = require("jack/urlmap").URLMap;
var ContentLength = require("jack/contentlength").ContentLength;
var Static = require("jack/static").Static;

function ExceptionLogger(app) {
    return function(env) {
        try {
            return app(env);
        } catch (e) {
            print(e);
        }
        return {
            status : 500,
            headers : { "Content-Length" : "0" },
            body : []
        };
    }
}

function NoCache(app) {
    return function(env) {
        var response = app(env);

        response.headers["Cache-Control"] = "no-cache";
        response.headers["Pragma"] = "no-cache";
        response.headers["Expires"] = "-1";

        return response;
    }
}

exports.app = NoCache(ExceptionLogger(URLMap(require("bcomm/server").routes)));