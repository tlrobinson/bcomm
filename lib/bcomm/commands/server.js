
var JACKUP = require("jackup");
var FILE = require("file");

var stream = require("narwhal/term").stream;

var parser = exports.parser = JACKUP.parser;
parser.help("start the BCOMM server");

parser.helpful();

parser.action(function (options) {
    options.args[0] = FILE.path(module.path).dirname().dirname().dirname().dirname().join("jackconfig.js");
    options.environment = "deployment";
    JACKUP.run(options);
});
