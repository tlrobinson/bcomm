var FILE = require("file");
var args = require("narwhal/args");
var parser = exports.parser = new args.Parser();

parser.help("Browser Command: Dispatch commands, tests, logs, etc to and from remote browsers.");

parser.command("server",    "bcomm/commands/server");

parser.command("config",    "bcomm/commands/config");

parser.command("runners",   "bcomm/commands/runners");
parser.command("tests",     "bcomm/commands/tests");
parser.command("tail",      "bcomm/commands/tail");

parser.command("console",   "bcomm/commands/console");

parser.command("upload",    "bcomm/commands/upload");
parser.command("run",       "bcomm/commands/run");

parser.command("abort",     "bcomm/commands/abort");
parser.command("reset",     "bcomm/commands/reset");

parser.helpful();

exports.main = function(args) {
    var options = parser.parse(args);
    if (!options.acted)
        parser.printHelp(options);
};
