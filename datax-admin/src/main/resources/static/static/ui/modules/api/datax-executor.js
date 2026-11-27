/* Original readable DataX Web UI source: api/datax-executor; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-executor", function(module, exports, require) {
  const requestModule = require("utils/request");

  // 执行器管理

  function getList() {
    return requestModule.default({
      url: '/api/jobGroup/list',
      method: 'get'
    })
  }

  function updated(data) {
    return requestModule.default({
      url: '/api/jobGroup/update',
      method: 'post',
      data
    })
  }

  function created(data) {
    return requestModule.default({
      url: '/api/jobGroup/save',
      method: 'post',
      data
    })
  }

  function loadById(id) {
    return requestModule.default({
      url: '/api/jobGroup/loadById?id=' + id,
      method: 'post'
    })
  }

  function deleted(id) {
    return requestModule.default({
      url: '/api/jobGroup/remove?id=' + id,
      method: 'post'
    })
  }

  Object.defineProperty(exports, "getList", {
    enumerable: true,
    get: function() {
      return getList;
    }
  });
  Object.defineProperty(exports, "updated", {
    enumerable: true,
    get: function() {
      return updated;
    }
  });
  Object.defineProperty(exports, "created", {
    enumerable: true,
    get: function() {
      return created;
    }
  });
  Object.defineProperty(exports, "loadById", {
    enumerable: true,
    get: function() {
      return loadById;
    }
  });
  Object.defineProperty(exports, "deleted", {
    enumerable: true,
    get: function() {
      return deleted;
    }
  });
});
