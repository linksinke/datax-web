/* Original readable DataX Web UI source: api/datax-job-log; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/datax-job-log", function(module, exports, require) {
  const requestModule = require("utils/request");

  // datax插件api
  function getList(params) {
    return requestModule.default({
      url: 'api/log/pageList',
      method: 'get',
      params
    })
  }

  function clearLog(jobGroup, jobId, type) {
    return requestModule.default({
      url: '/api/log/clearLog?jobGroup=' + jobGroup + '&jobId=' + jobId + '&type=' + type,
      method: 'post'
    })
  }

  function killJob(data) {
    return requestModule.default({
      url: '/api/log/killJob',
      method: 'post',
      data
    })
  }

  function viewJobLog(executorAddress, triggerTime, logId, fromLineNum) {
    return requestModule.default({
      url: '/api/log/logDetailCat?executorAddress=' + executorAddress + '&triggerTime=' + triggerTime + '&logId=' + logId + '&fromLineNum=' + fromLineNum,
      method: 'get'
    })
  }

  Object.defineProperty(exports, "getList", {
    enumerable: true,
    get: function() {
      return getList;
    }
  });
  Object.defineProperty(exports, "clearLog", {
    enumerable: true,
    get: function() {
      return clearLog;
    }
  });
  Object.defineProperty(exports, "killJob", {
    enumerable: true,
    get: function() {
      return killJob;
    }
  });
  Object.defineProperty(exports, "viewJobLog", {
    enumerable: true,
    get: function() {
      return viewJobLog;
    }
  });
});
