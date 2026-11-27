/* Original readable DataX Web UI source: utils/auth; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("utils/auth", function(module, exports, require) {
  const CookiesModule = require("js-cookie");

  const TokenKey = 'Admin-Token'

  function getToken() {
    return CookiesModule.default.get(TokenKey)
  }

  function setToken(token) {
    return CookiesModule.default.set(TokenKey, token)
  }

  function removeToken() {
    return CookiesModule.default.remove(TokenKey)
  }

  Object.defineProperty(exports, "getToken", {
    enumerable: true,
    get: function() {
      return getToken;
    }
  });
  Object.defineProperty(exports, "setToken", {
    enumerable: true,
    get: function() {
      return setToken;
    }
  });
  Object.defineProperty(exports, "removeToken", {
    enumerable: true,
    get: function() {
      return removeToken;
    }
  });
});
