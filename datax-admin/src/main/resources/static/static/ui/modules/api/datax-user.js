/* Original readable DataX Web UI source: api/datax-user; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-user", function(module, exports, require) {
  const requestModule = require("utils/request");

  // datax用户api

  function getList(params) {
    return requestModule.default({
      url: '/api/user/pageList',
      method: 'get',
      params
    })
  }

  function updateUser(data) {
    return requestModule.default({
      url: '/api/user/update',
      method: 'post',
      data
    })
  }

  function createUser(data) {
    return requestModule.default({
      url: '/api/user/add',
      method: 'post',
      data
    })
  }

  function deleteUser(id) {
    return requestModule.default({
      url: '/api/user/remove?id=' + id,
      method: 'post'
    })
  }

  Object.defineProperty(exports, "getList", {
    enumerable: true,
    get: function() {
      return getList;
    }
  });
  Object.defineProperty(exports, "updateUser", {
    enumerable: true,
    get: function() {
      return updateUser;
    }
  });
  Object.defineProperty(exports, "createUser", {
    enumerable: true,
    get: function() {
      return createUser;
    }
  });
  Object.defineProperty(exports, "deleteUser", {
    enumerable: true,
    get: function() {
      return deleteUser;
    }
  });
});
