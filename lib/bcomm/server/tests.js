
var BCOMM = require("bcomm");

var exports = require("../server");

var JSONApp = BCOMM.JSONApp;

var testsPath = BCOMM.dataPath.join("tests");
testsPath.mkdirs();

exports["/static/tests"] = require("jack/file").File(testsPath.toString());

exports["/run-test"] = JSONApp(function(request) {
    var runnerIDs = (request.runners && request.runners.length > 0) ? request.runners : getRunnerIDs();    
    runnerIDs.map(getRunner).forEach(function(runner, m) {
        if (!runner) {
            print("missing runner: "+runnerIDs[m]);
            return;
        }
    });
});


exports["/tests"] = JSONApp(function(request) {
    return getTests();
});

exports["/upload"] = JSONApp(function(request, env) {
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