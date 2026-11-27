/* Original readable DataX Web UI source: api/datax-job-template; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-job-template", function(module, exports, require) {
  const requestModule = require("utils/request");

  // datax插件api

  function getList(params) {
    return requestModule.default({
      url: 'api/jobTemplate/pageList',
      method: 'get',
      params
    })
  }

  function getExecutorList() {
    return requestModule.default({
      url: 'api/jobGroup/list',
      method: 'get'
    })
  }

  function updateJob(data) {
    return requestModule.default({
      url: '/api/jobTemplate/update',
      method: 'post',
      data
    })
  }

  function createJob(data) {
    return requestModule.default({
      url: '/api/jobTemplate/add/',
      method: 'post',
      data
    })
  }

  function removeJob(id) {
    return requestModule.default({
      url: '/api/jobTemplate/remove/' + id,
      method: 'post'
    })
  }

  function nextTriggerTime(cron) {
    return requestModule.default({
      url: '/api/jobTemplate/nextTriggerTime?cron=' + cron,
      method: 'get'
    })
  }

  function getUsersList(params) {
    return requestModule.default({
      url: 'api/user/list',
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
  Object.defineProperty(exports, "getExecutorList", {
    enumerable: true,
    get: function() {
      return getExecutorList;
    }
  });
  Object.defineProperty(exports, "updateJob", {
    enumerable: true,
    get: function() {
      return updateJob;
    }
  });
  Object.defineProperty(exports, "createJob", {
    enumerable: true,
    get: function() {
      return createJob;
    }
  });
  Object.defineProperty(exports, "removeJob", {
    enumerable: true,
    get: function() {
      return removeJob;
    }
  });
  Object.defineProperty(exports, "nextTriggerTime", {
    enumerable: true,
    get: function() {
      return nextTriggerTime;
    }
  });
  Object.defineProperty(exports, "getUsersList", {
    enumerable: true,
    get: function() {
      return getUsersList;
    }
  });
});
