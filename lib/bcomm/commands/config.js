
var UTIL = require("narwhal/util");
var OS = require("os");
var SYSTEM = require("system");

var BCOMM = require("bcomm");
var stream = require("narwhal/term").stream;
var readline = require("readline").readline;

var parser = exports.parser = new (require("narwhal/args").Parser)();
parser.help("set a config value");

parser.helpful();

parser.action(function (options) {
    if (options.args.length === 0) {
        var config = BCOMM.config();
        print(JSON.stringify(config, null, 2));
    }
    else if (options.args.length === 1) {
        var components = options.args[0].split(".");
        var config = BCOMM.config();
        var prop = config;
        while (components.length && prop != null) {
            prop = prop[components.shift()];
        }
        if (prop != null)
            print(prop);
    }
    else if (options.args.length === 2) {
        var components = options.args[0].split(".");
        BCOMM.config(function(config) {
            var prop = config;
            while (components.length > 1) {
                var key = components.shift();
                if (!key in prop)
                    prop[key] = {};
                prop = prop[key];
            }
            prop[components.shift()] = options.args[1];
        });
    }
});
