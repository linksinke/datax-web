/* Original readable DataX Web UI source: api/datax-job-project; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-job-project", function(module, exports, require) {
  const requestModule = require("utils/request");

  // project

  function list(params) {
    return requestModule.default({
      url: '/api/jobProject',
      method: 'get',
      params
    })
  }

  function updated(data) {
    return requestModule.default({
      url: '/api/jobProject',
      method: 'put',
      data
    })
  }

  function created(data) {
    return requestModule.default({
      url: '/api/jobProject',
      method: 'post',
      data
    })
  }

  function deleted(data) {
    return requestModule.default({
      url: '/api/jobProject',
      method: 'delete',
      params: data
    })
  }

  function getJobProjectList(params) {
    return requestModule.default({
      url: 'api/jobProject/list',
      method: 'get',
      params
    })
  }

  Object.defineProperty(exports, "list", {
    enumerable: true,
    get: function() {
      return list;
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
  Object.defineProperty(exports, "deleted", {
    enumerable: true,
    get: function() {
      return deleted;
    }
  });
  Object.defineProperty(exports, "getJobProjectList", {
    enumerable: true,
    get: function() {
      return getJobProjectList;
    }
  });
});
