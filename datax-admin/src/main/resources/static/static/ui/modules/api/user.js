/* Original readable DataX Web UI source: api/user; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/user", function(module, exports, require) {
  const requestModule = require("utils/request");

  function login(data) {
    return requestModule.default({
      url: '/api/auth/login',
      method: 'post',
      data
    })
  }

  function getInfo() {
    return requestModule.default({
      url: '/api/user/info',
      method: 'get'
    })
  }

  function logout() {
    return requestModule.default({
      url: '/api/user/logout',
      method: 'post'
    })
  }

  Object.defineProperty(exports, "login", {
    enumerable: true,
    get: function() {
      return login;
    }
  });
  Object.defineProperty(exports, "getInfo", {
    enumerable: true,
    get: function() {
      return getInfo;
    }
  });
  Object.defineProperty(exports, "logout", {
    enumerable: true,
    get: function() {
      return logout;
    }
  });
});
