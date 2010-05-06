
var JACK = require("jack");
var FILE = require("file");
var ZIP = require("zip");
var BCOMM = require("bcomm");

var SERVER = require("../server");
var CORE = require("../core");

var JSONApp = BCOMM.JSONApp;

var testsPath = BCOMM.dataPath.join("tests");
testsPath.mkdirs();


var routes = SERVER.routes;

routes["/static/tests"] = require("jack/file").File(testsPath.toString());

routes["/tests"] = JSONApp(function(request) {
    return getTests();
});

var testsServer = JACK.File(FILE.join(BCOMM.dataPath, "tests"));
routes["/_tests"] = function(env) {
    var components = env.PATH_INFO.split("/");
    
    env.PATH_INFO = "/" + components[2] + "/test/" + (components.slice(3).join("/") || "index.html");
    
    return testsServer(env);
};

routes["/run"] = JSONApp(function(request) {
    var taskIDs = [];

    CORE.runnersForRequest(request).forEach(function(runner) {
        request.tests.forEach(function(testID) {
            var test = getTest(testID);
            if (!test)
                throw "blah";
            
            taskIDs.push(CORE.addTask(runner, {
                type : "test",
                test : test
            }));
        });
    });
    return taskIDs;
});

routes["/upload"] = JSONApp(function(request, env) {
    var test = request;
    
    test.testID = BCOMM.generateID();
    test.created = new Date();

    var testPath = testsPath.join(test.testID);
    testPath.mkdirs();

    var zipPath = testPath.join("test.zip");

    zipPath.write(env["jsgi.input"].read(), "b");
    testPath.join("meta.json").write(JSON.stringify(test));
    
    var tmpPath = testPath.join("_tmp")
    
    ZIP.unzip(zipPath, tmpPath);
    
    // try root then all first level children
    var candidates = [tmpPath].concat(tmpPath.listPaths());
    var foundIndex = false;
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].join("index.html").isFile()) {
            candidates[i].move(testPath.join("test"));
            foundIndex = true;
            break;
        }
    }
    if (tmpPath.isDirectory())
        tmpPath.rmtree();

    if (!foundIndex)
        print("WARNING: couldn't find test root");

    return test;
});


function getTest(testID) {
    var metaPath = testsPath.join(testID, "meta.json");
    if (metaPath.isFile()) {
        var test = JSON.parse(metaPath.read());
        test.created = new Date(test.created);
        
        var configPath = testsPath.join(testID, "test", "config.json");
        if (configPath.isFile()) {
            test.config = JSON.parse(configPath.read());
        }
        
        return test;
    }
    return null;
}

function getTestIDs() {
    return testsPath.list();
}

function getTests() {
    return getTestIDs().map(function(testID) { return getTest(testID); });
}