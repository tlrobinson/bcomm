
var FILE = require("file");
var HTTP = require("http");
var UTIL = require("narwhal/util");
var OS = require("os");

var BCOMM = require("bcomm");

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("upload a test");

require("../runner-params").addRunnerSelectionParams(parser);

parser.option("-n", "--name", "name")
    .set()
    .help("set the test name");

parser.option("-d", "--description", "description")
    .set()
    .help("set the test description");

parser.helpful();

parser.action(function (options) {
    if (options.args.length < 1) {
        parser.printUsage(options);
        OS.exit(1);
    }
    
    print(exports.upload(options.args[0], options));
});

exports.upload = function(path, options) {
    var request = {};

    request.name = options.name || FILE.basename(path);

    if (options.description)
        request.description = options.description;

    path = FILE.path(path);

    if (path.isDirectory()) {
        var zipPath = FILE.path(path+".zip");
        OS.system("cd " + OS.enquote(FILE.dirname(path)) + " && " + ["zip", "-r", zipPath, FILE.basename(path)].map(OS.enquote).join(" ") + " > /dev/null");
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
