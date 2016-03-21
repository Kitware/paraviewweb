/* eslint-disable */
(function testSetup(window) {
  var callbackStack = [],
    callbackFnStack = [],
    intervalID = null;
  // ----------------------------------------------------------------------------

  function start() {
    intervalID = setInterval(processCallbackFnStack, 10);
    callbackStack = [];
    callbackFnStack = [];
  }

  // ----------------------------------------------------------------------------

  function callback(error, response) {
    callbackStack.push({
      error: error,
      response: response,
    });
  }

  // ----------------------------------------------------------------------------

  function waitAndRun(fn) {
    callbackFnStack.push(fn);
  }

  // ----------------------------------------------------------------------------

  function processCallbackFnStack() {
    if (callbackStack.length > 0 && callbackFnStack.length > 0) {
      var data = callbackStack.shift();
      var fn = callbackFnStack.shift();

      fn(data);
    }
  }

  // ----------------------------------------------------------------------------

  function done(fn) {
    window.clearInterval(intervalID);
    intervalID = null;
    fn();
  }

  // ----------------------------------------------------------------------------

  window.testHelper = callback;
  window.testHelper.start = start;
  window.testHelper.waitAndRun = waitAndRun;
  window.testHelper.done = done;

  // jasmine.getEnv().defaultTimeoutInterval = 60000;
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

})(window);
