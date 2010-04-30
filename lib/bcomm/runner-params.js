
exports.addRunnerSelectionParams = function(parser) {
    parser.option("-r", "runnerIDs")
        .push()
        .help("select a runner (multiple allowed)");
}
