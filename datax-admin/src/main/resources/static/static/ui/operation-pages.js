/* 项目方案、后台作业、导出记录和操作日志页面。 */
(function (global) {
  'use strict';
  const UI = global.DataxUI;
  const pages = global.DataxPages;
  function data(extra) { return Object.assign({ list: [], total: 0, listQuery: { current: 1, size: 10 }, detail: null, detailVisible: false }, extra || {}); }
  function fetch(url) { return function () { const vm = this; return UI.read(vm, () => UI.api(url, 'get', null, vm.listQuery), result => { vm.list = result.records || []; vm.total = Number(result.total || 0); }); }; }
  function created() { this.fetchData(); }
  const methods = {
    uiStateName(state) { return DataxWorkbench.labels[state] || state; },
    uiStateType(state) { return ({ SUCCEEDED: 'success', FAILED: 'danger', CANCELLED: 'info', RUNNING: '', QUEUED: 'warning' })[state]; },
    uiBytes(value) { return value >= 1048576 ? (value / 1048576).toFixed(2) + ' MB' : value >= 1024 ? (value / 1024).toFixed(1) + ' KB' : value + ' B'; },
    uiDownload(row) { return UI.commit(this, 'download-' + row.id, () => DataxWorkbench.download(row.id)); },
    uiExportType(kind) { return ({ EXPORT_BATCH: '整批配置', EXPORT_SELECTION: '所选配置', EXPORT_TEMPLATE: '单份配置' })[kind] || kind; }
  };
  pages.operations = {
    data: () => data({ listQuery: { current: 1, size: 10, state: '' }, states: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'], uiPoll: null }),
    methods: Object.assign({}, methods, {
      fetchData: fetch('/api/workbench/operations'),
      uiPollJobs() { const vm = this; clearTimeout(vm.uiPoll); vm.uiPoll = setTimeout(async () => { if (!document.hidden) { await vm.fetchData(); if (vm.detailVisible && vm.detail && ['QUEUED','RUNNING'].includes(vm.detail.state)) await vm.uiDetails(vm.detail); } if (!vm._isDestroyed) vm.uiPollJobs(); }, 4000); },
      uiDetails(row) { const vm = this; return UI.commit(vm, 'details-' + row.id, () => UI.api('/api/workbench/operations/' + encodeURIComponent(row.id)), result => { vm.detail = result; vm.detailVisible = true; }); },
      uiCancel(row) { const vm = this; return UI.commit(vm, 'cancel-' + row.id, () => vm.$confirm('取消这项尚未开始的后台作业？', '取消排队', { confirmButtonText: '取消作业', cancelButtonText: '保留', type: 'warning' })
        .then(() => UI.api('/api/workbench/operations/' + row.id + '/cancel', 'post')), () => { vm.fetchData(); DataxWorkbench.refresh(); }); },
      uiRetry(row) { const vm = this; return UI.commit(vm, 'retry-' + row.id, () => UI.api('/api/workbench/operations/' + row.id + '/retry', 'post'), () => { vm.$message.success('已提交重试'); vm.fetchData(); DataxWorkbench.refresh(); }); },
      uiOpenResult() {
        const result = this.detail && this.detail.result; if (!result) return;
        if (result.exportId) return this.uiDownload({ id: result.exportId });
        this.detailVisible = false;
        if (this.detail.kind === 'BATCH_GENERATE' && result.batchId) return this.$router.push({path:'/datax/job/configTemplate',query:{batchId:result.batchId}});
        if (result.templateId) return this.$router.push('/datax/job/configTemplateEdit/' + result.templateId);
        if (result.batchId) return this.$router.push({ path: '/datax/job/configTemplate', query: { batchId: result.batchId } });
        if (result.recipeId) return this.$router.push('/datax/project/recipes');
        if (result.schedulerTemplateId) return this.$router.push('/datax/job/jobTemplate');
      }
    }),
    created() { this.fetchData(); this.uiPollJobs(); if (this.$route.query.operationId) this.uiDetails({ id: this.$route.query.operationId }); },
    enhance(options) { options.beforeDestroy = [].concat(options.beforeDestroy || [], function () { clearTimeout(this.uiPoll); }); options.watch = Object.assign({}, options.watch, { '$route.query.operationId': function(id) { if (id) this.uiDetails({id:id}); } }); }
  };
  pages.exports = { data: () => data(), methods: Object.assign({}, methods, { fetchData: fetch('/api/workbench/exports') }), created };
  pages.audit = { data: () => data({ listQuery: { current: 1, size: 10, keyword: '' } }), methods: Object.assign({}, methods, { fetchData: fetch('/api/workbench/audit'), uiDetails(row) { this.detail = row; this.detailVisible = true; } }), created };
  pages.recipes = {
    data: () => data({ projects: [], listQuery: { current: 1, size: 10, keyword: '', projectId: null } }),
    methods: {
      fetchData: fetch('/api/projectRecipes'),
      uiCreate() { this.$router.push({ path: '/datax/job/configTemplateEdit/new-' + Date.now(), query: { projectId: this.listQuery.projectId || undefined } }); },
      uiUse(row) { this.$router.push({ path: '/datax/job/configTemplateEdit/new-' + Date.now(), query: { projectId: row.projectId, recipeId: row.id } }); },
      uiGenerate(row) { return UI.commit(this, 'generate-' + row.id, () => this.$confirm('使用“' + row.name + '”已保存的读写配置生成新批次？', '生成配置批次', { confirmButtonText: '提交生成', cancelButtonText: '取消' })
        .then(() => DataxWorkbench.submit('BATCH_GENERATE', { recipeId: row.id }, '按项目方案生成：' + row.name))); },
      uiCopy(row) { return UI.commit(this, 'copy-' + row.id, () => this.$prompt('请输入副本名称', '复制项目方案', { inputValue: row.name.slice(0, 97) + ' 副本', inputValidator: name => !!name && name.trim().length <= 100 || '名称为1至100个字符' })
        .then(value => DataxWorkbench.submit('COPY_PROJECT_RECIPE', { id: row.id, name: value.value }, '复制项目方案：' + row.name))); },
      uiRemove(row) { const vm = this; return UI.commit(vm, 'delete-' + row.id, () => vm.$confirm('删除方案“' + row.name + '”？已生成的配置和批次会保留。', '删除项目方案', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
        .then(() => UI.api('/api/projectRecipes/' + row.id, 'delete')), () => vm.fetchData()); }
    },
    created() { this.listQuery.projectId = Number(this.$route.query.projectId) || null; this.fetchData(); UI.api('/api/jobProject/list').then(rows => { this.projects = rows || []; }).catch(error => this.$set(this.uiOptionErrors, 'projects', error.message)); }
  };
  // 调度模板的复制交给后台作业，不占用当前列表页面。
  pages.schedulerTemplates.methods.uiCopy = function (row) {
    return UI.commit(this, 'copy-' + row.id, () => this.$prompt('请输入调度模板副本名称', '复制调度模板', { inputValue: row.jobDesc.slice(0, 97) + ' 副本', inputValidator: value => !!value && value.trim().length <= 100 || '名称为1至100个字符' })
      .then(input => DataxWorkbench.submit('COPY_JOB_TEMPLATE', { id: row.id, name: input.value }, '复制调度模板：' + row.jobDesc)));
  };
})(window);
