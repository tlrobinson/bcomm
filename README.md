BCOMM: Browser Command
======================

Dispatch commands, tests, logs, etc to and from remote browsers.

Usage
-----

The following are example usages. See the help for each command for more details.

(shell commands are preceded by "$" and bcomm console commands are preceded by ">")

Startup the server:

    $ bcomm server

After the server is started, point multiple web browsers at the server (e.x http://localhost:8080/ if on local machine with default port) to start them as runners.

Set the client tool's (the "bcomm" command) server url (if different than localhost:8080):

    $ bcomm config server.url http://12.34.56.78:1234/

List all connected runners (browser) along with their browser user agent and current location:

    $ bcomm runners
    6ba1da: Safari 5 (Mac) => http://12.34.56.78:1234/static/dispatcher.html
    bbf29f: Chrome 6 (Mac) => http://12.34.56.78:1234/static/dispatcher.html
    72fcfd: Opera 9.8 (Mac) => http://12.34.56.78:1234/static/dispatcher.html
    238d84: Firefox 3.6 (Mac) => http://12.34.56.78:1234/static/dispatcher.html

Each runner (or uploaded test or task) is identified by a 6 digit hex string.

Open a simple JavaScript console to the connected runners and issue commands:

    $ bcomm console
    > 1+1
    238d84: 2
    bbf29f: 2
    72fcfd: 2
    6ba1da: 2
    > console.log("hello!")
    6ba1da: console.log("hello!")
    6ba1da: undefined
    bbf29f: console.log("hello!")
    bbf29f: undefined
    72fcfd: console.log("hello!")
    72fcfd: undefined
    238d84: console.log("hello!")
    238d84: undefined
    >

("undefined" is printed here because console.log() has no return value)

Upload a test (a test is a directory containing an "index.html" file):

    $ bcomm upload example
    cf1091

Run the last uploaded test:

    $ bcomm run
    Running tests: cf1091
    238d84: console.log("hello!")
    238d84: console.log("world!")
    238d84: {"type": "complete", "result": "test result goes here", "complete": true, "taskID": "8c0f28", "runnerID": "238d84"}
    6ba1da: console.log("hello!")
    6ba1da: console.log("world!")
    6ba1da: {"type": "complete", "result": "test result goes here", "complete": true, "taskID": "4fe957", "runnerID": "6ba1da"}
    bbf29f: console.log("hello!")
    bbf29f: console.log("world!")
    bbf29f: {"type": "complete", "result": "test result goes here", "complete": true, "taskID": "65702f", "runnerID": "bbf29f"}
    72fcfd: console.log("hello!")
    72fcfd: console.log("world!")
    72fcfd: {"type": "complete", "result": "test result goes here", "complete": true, "taskID": "a34875", "runnerID": "72fcfd"}

BCOMM must be notified when the test is done by calling `BCOMM.complete(result)` otherwise the runner will be blocked.

Other commands include:

* `reset`: refreshes runner(s)
* `abort`: aborts the runner(s) current task (useful if it finished without calling `BCOMM.complete()`)
* `tail`: lists all console output, connects, disconnects, etc

TODO
----

* Better output (print browser/version/os instead of runnerID)
* More robust (timeout tests, etc)
* Cleanup old tests
* Auto-run uploads
* Port server to non-blocking platform
