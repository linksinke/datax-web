/* Original readable DataX Web UI source: api/datax-job-info; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-job-info", function(module, exports, require) {
  const requestModule = require("utils/request");

  // datax插件api

  function getList(params) {
    return requestModule.default({
      url: 'api/job/pageList',
      method: 'get',
      params
    })
  }

  function triggerJob(data) {
    return requestModule.default({
      url: '/api/job/trigger',
      method: 'post',
      data
    })
  }

  function startJob(id) {
    return requestModule.default({
      url: '/api/job/start?id=' + id,
      method: 'post'
    })
  }

  function stopJob(id) {
    return requestModule.default({
      url: '/api/job/stop?id=' + id,
      method: 'post'
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
      url: '/api/job/update',
      method: 'post',
      data
    })
  }

  function createJob(data) {
    return requestModule.default({
      url: '/api/job/add/',
      method: 'post',
      data
    })
  }

  function removeJob(id) {
    return requestModule.default({
      url: '/api/job/remove/' + id,
      method: 'post'
    })
  }

  function nextTriggerTime(cron) {
    return requestModule.default({
      url: '/api/job/nextTriggerTime?cron=' + cron,
      method: 'get'
    })
  }

  function viewJobLog(id) {
    return requestModule.default({
      url: '/api/log/logDetailCat?id=' + id,
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

  function getJobIdList(params) {
    return requestModule.default({
      url: 'api/job/list',
      method: 'get',
      params
    })
  }
  // batchAdd
  function batchAddJob(data) {
    return requestModule.default({
      url: '/api/job/batchAdd',
      method: 'post',
      data
    })
  }

  Object.defineProperty(exports, "getList", {
    enumerable: true,
    get: function() {
      return getList;
    }
  });
  Object.defineProperty(exports, "triggerJob", {
    enumerable: true,
    get: function() {
      return triggerJob;
    }
  });
  Object.defineProperty(exports, "startJob", {
    enumerable: true,
    get: function() {
      return startJob;
    }
  });
  Object.defineProperty(exports, "stopJob", {
    enumerable: true,
    get: function() {
      return stopJob;
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
  Object.defineProperty(exports, "viewJobLog", {
    enumerable: true,
    get: function() {
      return viewJobLog;
    }
  });
  Object.defineProperty(exports, "getUsersList", {
    enumerable: true,
    get: function() {
      return getUsersList;
    }
  });
  Object.defineProperty(exports, "getJobIdList", {
    enumerable: true,
    get: function() {
      return getJobIdList;
    }
  });
  Object.defineProperty(exports, "batchAddJob", {
    enumerable: true,
    get: function() {
      return batchAddJob;
    }
  });
});
