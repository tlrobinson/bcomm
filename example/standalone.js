window.onload = function() {
    // if BCOMM.init() is not called first, console.log() will not be setup until the next event after window.onload
    // (e.x. we'd get "world!" but not "hello!")
    window.parent.BCOMM.init(window);
    console.log("hello! (standalone js)");

    window.setTimeout(function() {
        console.log("world! (standalone js)");

        // all tests must call BCOMM.complete(result) to end
        BCOMM.complete("test result goes here. can be any JSON encodable object. (standalone js)");
    }, 1)
}
