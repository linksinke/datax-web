/* Original readable DataX Web UI source: api/datax-jdbcDatasource; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-jdbcDatasource", function(module, exports, require) {
  const requestModule = require("utils/request");

  // datax插件api

  function list(params) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource',
      method: 'get',
      params
    })
  }

  function fetched(params) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource/' + params,
      method: 'get'
    })
  }

  function updated(data) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource',
      method: 'put',
      data
    })
  }

  function created(data) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource',
      method: 'post',
      data
    })
  }

  function deleted(data) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource',
      method: 'delete',
      params: data
    })
  }

  function test(data) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource/test',
      method: 'post',
      data
    })
  }

  function getDataSourceList(params) {
    return requestModule.default({
      url: '/api/jobJdbcDatasource/all',
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
  Object.defineProperty(exports, "fetched", {
    enumerable: true,
    get: function() {
      return fetched;
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
  Object.defineProperty(exports, "test", {
    enumerable: true,
    get: function() {
      return test;
    }
  });
  Object.defineProperty(exports, "getDataSourceList", {
    enumerable: true,
    get: function() {
      return getDataSourceList;
    }
  });
});
