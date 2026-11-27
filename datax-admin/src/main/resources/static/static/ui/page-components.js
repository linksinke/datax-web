/* Readable component options for each page. All scripts run directly in the browser. */
(function () {
  const pages = {
    overview: 'views/dashboard/admin/index', tasks: 'views/datax/jobInfo/index',
    schedulerTemplates: 'views/datax/jobTemplate/index', datasources: 'views/datax/jdbc-datasource/index',
    executors: 'views/datax/executor/index', users: 'views/datax/user/index', logs: 'views/datax/jobLog/index',
    resources: 'views/datax/registry/index', buildSingle: 'views/datax/json-build/index',
    buildBatch: 'views/datax/json-build-batch/index', login: 'views/login/index', profile: 'views/profile/index',
    'not-found': 'views/error-page/404', forbidden: 'views/error-page/401'
  };
  window.DataxPageComponents = {
    load(view, require) {
      if (['operations', 'exports', 'audit', 'recipes'].includes(view)) return Promise.resolve({ name: ({operations:'WorkbenchJobs',exports:'ExportRecords',audit:'OperationAudit',recipes:'ProjectRecipes'})[view] });
      if (view === 'projects') return Promise.resolve(require('datax-project'));
      if (view === 'batches') return Promise.resolve(require('datax-config-template').List);
      if (view === 'templateEditor') return Promise.resolve(require('datax-config-template').Editor);
      if (!pages[view]) return Promise.reject(new Error('未登记的页面：' + view));
      return Promise.resolve(require(pages[view]).default);
    }
  };
})();
