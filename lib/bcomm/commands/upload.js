
var FILE = require("file");
var HTTP = require("http");
var UTIL = require("narwhal/util");
var OS = require("os");

var BCOMM = require("bcomm");

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("upload a test (a single HTML or JavaScript file, or a directory containing at least an index.html file)");

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

    var testID = exports.upload(options.args[0], options);

    print(testID);

    BCOMM.config(function(config) {
        config["lastUploadedTestID"] = testID;
    });
});

exports.upload = function(path, options) {
    var request = {};

    request.name = options.name || FILE.basename(path);

    if (options.description)
        request.description = options.description;

    path = FILE.path(path);

    var tmpDir = null;
    var tmpZip = null;

    // if the path is an HTML or JavaScript file create a temporary bundle
    if (path.isFile()) {
        var ext = path.extension();
        if (ext === ".html") {
            tmpDir = FILE.path("tmp-dir-" + Math.floor(Math.random() * Math.pow(2,32)).toString(16));
            tmpDir.mkdir();
            path.copy(tmpDir.join("index.html"));
            path = tmpDir;
        } else if (ext === ".js") {
            tmpDir = FILE.path("tmp-dir-" + Math.floor(Math.random() * Math.pow(2,32)).toString(16));
            tmpDir.mkdir();
            path.copy(tmpDir.join("index.js"));
            tmpDir.join("index.html").write('<html><head><script type="text/javascript" charset="utf-8" src="index.js"></script></head><body></body></html>');
            path = tmpDir;
        } else if (ext === ".zip") {
            // do nothing
        } else {
            throw new Error("Invalid input file. Accepts .js, .html, .zip, or a directory.");
        }
    }

    if (path.isDirectory()) {
        if (/[\/\\]$/.test(path)) path = path.dirname(); // strip trailing slash if any
        tmpZip = FILE.path("tmp-zip-" + Math.floor(Math.random() * Math.pow(2,32)).toString(16) + ".zip");
        OS.system("cd " + OS.enquote(path.dirname()) + " && " + ["zip", "-r", tmpZip.absolute(), path.basename()].map(OS.enquote).join(" ") /*+ " > /dev/null"*/);
        path = tmpZip;
    }

    if (tmpDir) {
        tmpDir.rmtree();
    }

    if (!path.isFile()) {
        throw new Error("Does not exist: " + path);
    }

    var response = BCOMM.request("upload", request, {
        method: "POST",
        headers: { "Content-Length" : path.size().toString(10) },
        block : function(req) {
            req.write(path.read("b"));
            if (tmpZip) {
                tmpZip.remove();
            }
        }
    });

    return response.testID;
}
