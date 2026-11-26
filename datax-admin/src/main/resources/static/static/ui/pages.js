/* Shared page behavior. API requests reuse the existing authenticated browser client. */
(function (global) {
  "use strict";
  var UI = global.DataxUI;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function query(vm) {
    var value = Object.assign({}, vm.listQuery);
    if (vm.projectIds !== undefined) { value.projectIds = Array.isArray(vm.projectIds) ? vm.projectIds.join(",") : vm.projectIds; if (!value.projectIds) delete value.projectIds; }
    if ("jobId" in value) value.jobId = Number(value.jobId) || 0;
    if ("jobGroup" in value) value.jobGroup = Number(value.jobGroup) || 0;
    return value;
  }
  function option(vm, key, url, title) {
    var sequence = (vm.uiOptionSequence[key] || 0) + 1;
    vm.$set(vm.uiOptionSequence, key, sequence); vm.$set(vm.uiOptionLoading, key, true);
    return UI.api(url).then(function (value) {
      if (sequence !== vm.uiOptionSequence[key] || vm._isDestroyed) return;
      vm[key] = value || []; vm.$delete(vm.uiOptionErrors, key);
    }).catch(function (error) {
      if (sequence === vm.uiOptionSequence[key]) vm.$set(vm.uiOptionErrors, key, title + "加载失败，请重试");
    }).finally(function () { if (sequence === vm.uiOptionSequence[key]) vm.$set(vm.uiOptionLoading, key, false); });
  }
  function list(url, mode) {
    return function () {
      var vm = this;
      return UI.read(vm, function () { return UI.api(url, "get", null, query(vm)); }, function (value) {
        if (mode === "array") { vm.list = value || []; vm.total = vm.list.length; }
        else if (mode === "page") { vm.list = value.records || []; vm.total = Number(value.total || 0); }
        else { vm.list = value.data || []; vm.total = Number(value.recordsTotal || 0); }
      });
    };
  }
  function reload(vm) {
    vm.uiRefresh();
    ["getExecutor", "getJobIdList", "getJobProject", "getDataSourceList"].forEach(function (method) { if (vm[method]) vm[method](); });
  }
  function open(vm, row) {
    vm.uiTab = "basic"; vm.uiFormError = "";
    if (row) (vm.handlerUpdate || vm.handleUpdate).call(vm, row);
    else vm.handleCreate();
    if (vm.temp && "childJobId" in vm.temp && !vm.temp.childJobId) vm.temp.childJobId = [];
    if (!row && vm.temp && "jobCron" in vm.temp) {
      vm.temp.jobCron = "0 0 0 * * ?"; vm.temp.glueType = "BEAN";
      vm.temp.executorRouteStrategy = "FIRST"; vm.temp.executorBlockStrategy = "SERIAL_EXECUTION";
      vm.temp.executorTimeout = 0; vm.temp.executorFailRetryCount = 0;
    }
  }
  function taskPayload(vm, schedulerTemplate) {
    var value = clone(vm.temp);
    if (Array.isArray(value.childJobId)) value.childJobId = value.childJobId.map(function (item) { return typeof item === "object" ? item.id : item; }).join(",");
    if (!schedulerTemplate) {
      if (value.glueType === "BEAN") {
        var json = typeof vm.jobJson === "string" ? vm.jobJson : JSON.stringify(vm.jobJson);
        try { if (!json || !JSON.parse(json) || typeof JSON.parse(json) !== "object") throw new Error(); }
        catch (error) { throw new Error("JSON 配置无效，请在任务内容中检查后保存"); }
        value.jobJson = json; value.executorHandler = "executorJobHandler"; value.glueSource = null;
      } else { value.glueSource = vm.glueSource; value.jobJson = null; value.executorHandler = ""; }
      if (value.incrementType === 3 && vm.partitionField) value.partitionInfo = [vm.partitionField, vm.timeOffset, vm.timeFormatType].join(",");
    }
    return value;
  }
  function save(vm, config) {
    vm.uiFormError = "";
    return UI.commit(vm, "save", function () {
      return UI.validate(vm).then(function (valid) {
        if (!valid) return { cancelled: true };
        var value = config.task ? taskPayload(vm, config.template) : clone(vm.temp);
        return UI.api(vm.dialogStatus === "create" ? config.create : config.update, "post", value);
      });
    }, function (value) {
      if (value && value.cancelled) return false;
      vm.dialogFormVisible = false; vm.$message.success("已保存"); vm.uiRefresh(); return true;
    });
  }
  function remove(vm, row, url, params) {
    return UI.commit(vm, "delete-" + row.id, function () {
      return vm.$confirm("确认删除“" + (row.jobDesc || row.title || row.username || row.datasourceName || row.id) + "”？", "删除确认", {
        type: "warning", confirmButtonText: "删除", cancelButtonText: "取消"
      }).then(function () { return UI.api(url, "post", null, params); });
    }, function () {
      if ((vm.list || []).length === 1 && vm.listQuery && vm.listQuery.current > 1) --vm.listQuery.current;
      vm.$message.success("已删除"); vm.uiRefresh(); return true;
    });
  }
  var taskOptions = {
    getExecutor: function () { return option(this, "executorList", "/api/jobGroup/list", "执行器"); },
    getJobIdList: function () { return option(this, "jobIdList", "/api/job/list", "子任务"); },
    getJobProject: function () { return option(this, "jobProjectList", "/api/jobProject/list", "项目"); },
    getDataSourceList: function () { return option(this, "dataSourceList", "/api/jobJdbcDatasource/all", "数据源"); },
    uiReload: function () { reload(this); },
    uiOpenCreate: function () { open(this); }, uiOpenUpdate: function (row) { open(this, row); },
    uiNextTimes: function () {
      var vm = this;
      return UI.commit(vm, "nextTimes", function () { return UI.api("/api/job/nextTriggerTime", "get", null, { cron: vm.temp.jobCron }); },
        function (rows) { vm.triggerNextTimes = (rows || []).join("\n"); });
    }
  };
  var taskConfig = { task: true, create: "/api/job/add", update: "/api/job/update" };
  var templateConfig = { task: true, template: true, create: "/api/jobTemplate/add", update: "/api/jobTemplate/update" };
  global.DataxPages = {
    tasks: { methods: Object.assign({}, taskOptions, {
      fetchData: list("/api/job/pageList"), uiSave: function () { return save(this, taskConfig); },
      uiRemove: function (row) { return remove(this, row, "/api/job/remove/" + row.id); },
      uiToggleTask: function (row, enabled) {
        var vm = this;
        return UI.commit(vm, "state-" + row.id, function () { return UI.api(enabled ? "/api/job/start" : "/api/job/stop", "post", null, { id: row.id }); },
          function () { vm.$set(row, "triggerStatus", enabled ? 1 : 0); vm.$message.success(enabled ? "调度已启用" : "调度已停止"); });
      },
      uiExecute: function (row) {
        var vm = this;
        return UI.commit(vm, "execute-" + row.id, function () { return vm.$confirm("立即执行任务“" + row.jobDesc + "”？", "执行任务", {
          confirmButtonText: "执行", cancelButtonText: "取消", type: "warning"
        }).then(function () { return UI.api("/api/job/trigger", "post", { jobId: row.id, executorParam: row.executorParam }); }); },
          function () { vm.$message.success("执行请求已提交，可在执行日志查看进度"); });
      }
    }) },
    schedulerTemplates: { methods: Object.assign({}, taskOptions, {
      fetchData: list("/api/jobTemplate/pageList"), uiSave: function () { return save(this, templateConfig); },
      uiRemove: function (row) { return remove(this, row, "/api/jobTemplate/remove/" + row.id); }
    }) },
    datasources: { methods: {
      fetchData: list("/api/jobJdbcDatasource", "page"),
      uiRemove: function (row) {
        var vm = this;
        return UI.commit(vm, "delete-" + row.id, function () { return vm.$confirm("确认删除数据源“" + row.datasourceName + "”？", "删除确认", {
          type: "warning", confirmButtonText: "删除", cancelButtonText: "取消"
        }).then(function () { return UI.api("/api/jobJdbcDatasource", "delete", null, { idList: row.id }); }); }, function () { vm.$message.success("已删除"); vm.uiRefresh(); });
      },
      uiTypeChange: function (value) { if (value !== this.temp.datasource) { this.$set(this.temp, "datasource", value); this.selectDataSource(value); this.connectionResult = null; } },
      uiClearConnection: function () { this.connectionResult = null; }
    } },
    executors: { methods: {
      fetchData: list("/api/jobGroup/list", "array"), uiOpenCreate: function () { open(this); this.temp.order = 0; this.temp.addressType = 0; }, uiOpenUpdate: function (row) { open(this, row); },
      uiSave: function () { return save(this, { create: "/api/jobGroup/save", update: "/api/jobGroup/update" }); },
      uiRemove: function (row) { return remove(this, row, "/api/jobGroup/remove", { id: row.id }); }
    } },
    users: { methods: {
      fetchData: list("/api/user/pageList"), uiOpenCreate: function () { open(this); this.temp.role = "ROLE_USER"; }, uiOpenUpdate: function (row) { open(this, row); },
      uiSave: function () { return save(this, { create: "/api/user/add", update: "/api/user/update" }); },
      uiRemove: function (row) { return remove(this, row, "/api/user/remove", { id: row.id }); }
    } },
    resources: { methods: { fetchData: list("/api/jobRegistry", "page"), uiPercent: function (value) { return Math.min(100, Math.max(0, Number(value) || 0)); } } },
    overview: {
      data: function () { return { uiOverview: { success: 0, running: 0, failed: 0 } }; },
      methods: {
        fetchData: function () {
          var vm = this;
          return UI.read(vm, function () { return UI.api("/api/chartInfo", "post"); }, function (value) {
            vm.uiOverview = { success: Number(value.triggerCountSucTotal || 0), running: Number(value.triggerCountRunningTotal || 0), failed: Number(value.triggerCountFailTotal || 0) };
            vm.lineChartData = { successData: value.triggerDayCountSucList || [], failData: value.triggerDayCountFailList || [], dayList: value.triggerDayList || [] };
          });
        }, chartInfo: function () { return this.fetchData(); }
      }
    },
    logs: { methods: {
      fetchData: list("/api/log/pageList"), getExecutor: taskOptions.getExecutor, uiReload: function () { reload(this); },
      uiClearLogs: function () {
        var vm = this;
        return UI.commit(vm, "save", function () { return vm.$confirm("确认按所选范围清理执行日志？", "清理日志", { type: "warning", confirmButtonText: "清理", cancelButtonText: "取消" })
          .then(function () { return UI.api("/api/log/clearLog", "post", null, { jobGroup: vm.temp.jobGroup, jobId: vm.temp.jobId, type: vm.temp.deleteType }); }); },
          function () { vm.dialogFormVisible = false; vm.$message.success("日志已清理"); vm.uiRefresh(); });
      },
      uiViewLog: function (row) {
        this.dialogVisible = true; this.logContent = "";
        this.jobLogQuery = { executorAddress: row.executorAddress, triggerTime: Date.parse(row.triggerTime), id: row.id, fromLineNum: 1 };
        return this.uiLoadLog();
      },
      uiLoadLog: function () {
        var vm = this;
        return UI.commit(vm, "log", function () { return UI.api("/api/log/logDetailCat", "get", null, {
          executorAddress: vm.jobLogQuery.executorAddress, triggerTime: vm.jobLogQuery.triggerTime, logId: vm.jobLogQuery.id, fromLineNum: vm.jobLogQuery.fromLineNum
        }); }, function (value) {
          vm.logContent += value.logContent || ""; vm.jobLogQuery.fromLineNum = Number(value.toLineNum || vm.jobLogQuery.fromLineNum - 1) + 1;
          vm.logShow = true;
        });
      },
      uiKill: function (row) {
        var vm = this;
        return UI.commit(vm, "kill-" + row.id, function () { return vm.$confirm("确认终止该运行任务？", "终止任务", { type: "warning", confirmButtonText: "终止", cancelButtonText: "取消" })
          .then(function () { return UI.api("/api/log/killJob", "post", row); }); }, function () { vm.$message.success("终止请求已提交"); vm.uiRefresh(); });
      }
    } },
    login: { created: function () { this.loginForm.username = ""; this.loginForm.password = ""; } },
    profile: { computed: { uiName: function () { return this.$store.getters.name || "当前账号"; }, uiRoles: function () { return (this.$store.getters.roles || []).map(function (role) { return role === "ROLE_ADMIN" ? "管理员" : "普通用户"; }).join("、"); } } }
  };
})(window);
