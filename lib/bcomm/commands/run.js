
var BCOMM = require("bcomm");
var stream = require("term").stream;

var parser = exports.parser = new (require("args").Parser)();
parser.help("run a test");

parser.option('-r', 'runners')
    .push()
    .help("select a runner (multiple allowed)");

parser.helpful();

parser.action(function (options) {
    var request = {
        runners : options.runners,
        tests : options.args
    };
    var response = BCOMM.request("run", request);
});
