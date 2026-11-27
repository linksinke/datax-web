/* Original readable DataX Web UI source: api/datax-registry; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-registry", function(module, exports, require) {
  const requestModule = require("utils/request");

  // datax 执行器注册信息

  function getList(params) {
    return requestModule.default({
      url: '/api/jobRegistry',
      method: 'get',
      params
    })
  }

  Object.defineProperty(exports, "getList", {
    enumerable: true,
    get: function() {
      return getList;
    }
  });
});
