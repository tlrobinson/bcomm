
var FILE = require("file");
var HTTP = require("http");
var UTIL = require("util");
var OS = require("os");

var BCOMM = require("bcomm");

var parser = exports.parser = new (require("args").Parser)();
parser.help("upload a test");
parser.helpful();

parser.action(function (options) {
    if (options.args.length < 1) {
        parser.printUsage(options);
        OS.exit(1);
    }
    
    print(exports.upload(options.args[0]));
});

exports.upload = function(path) {
    var request = {
        name : FILE.basename(path)
    };
    
    path = FILE.path(path);

    if (path.isDirectory()) {
        var zipPath = FILE.path(path+".zip");
        OS.system(["zip", "-r", zipPath, path]);
        path = zipPath;
    }
    
    if (!path.isFile()) {
        throw new Error("Does not exist: " + path);
    }

    var response = BCOMM.request("upload", request, {
        method: "POST",
        headers: { "Content-Length" : path.size().toString(10) },
        block : function(req) {
            req.write(path.read("b"));
        }
    });

    return response.testID;
}
