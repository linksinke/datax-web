/* Original readable DataX Web UI source: api/datax-json; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-json", function(module, exports, require) {
  const requestModule = require("utils/request");

  // buildJobJson
  function buildJobJson(data) {
    return requestModule.default({
      url: '/api/dataxJson/buildJson',
      method: 'post',
      data
    })
  }

  Object.defineProperty(exports, "buildJobJson", {
    enumerable: true,
    get: function() {
      return buildJobJson;
    }
  });
});
