/* 后台操作的浏览器入口：提交立即返回，完成通知与结果保存在管理库。 */
(function (global) {
  'use strict';
  let Vue, router, timer, revision = 0, started = false, initialized = false;
  const seen = new Set(), watched = new Set(), requests = new Map();
  const state = { running: 0, unread: 0, records: [], loading: false, available: true };
  const labels = { QUEUED: '排队中', RUNNING: '处理中', SUCCEEDED: '已完成', FAILED: '失败', CANCELLED: '已取消' };
  function key() { return global.crypto && crypto.randomUUID ? crypto.randomUUID() : 'op-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
  async function refresh() {
    const version = revision;
    state.loading = true;
    try {
      const result = await DataxUI.api('/api/workbench/notifications');
      if (version !== revision) return;
      state.available = true; state.running = Number(result.running || 0); state.unread = Number(result.unread || 0); state.records = result.records || [];
      state.records.forEach(record => {
        if (!seen.has(record.id) && (initialized || watched.has(record.id))) {
          Vue.prototype.$notify({ title: record.state === 'SUCCEEDED' ? '后台操作已完成' : '后台操作有结果',
            message: record.name + '：' + (record.message || labels[record.state]), type: record.state === 'SUCCEEDED' ? 'success' : 'warning',
            duration: 6000, onClick: () => router.push('/datax/operations/jobs?operationId=' + record.id) });
        }
        seen.add(record.id); watched.delete(record.id);
      });
      initialized = true;
    } catch (error) { if (version === revision) state.available = false; }
    finally { if (version === revision) state.loading = false; }
  }
  async function poll() {
    if (!started) return;
    if (!document.hidden) await refresh();
    if (started) timer = setTimeout(poll, state.running ? 4000 : 15000);
  }
  async function submit(kind, payload, name) {
    const fingerprint = JSON.stringify([kind, payload]);
    let request = requests.get(fingerprint);
    if (!request) { request = { kind, payload, name, requestKey: key() }; requests.set(fingerprint, request); }
    const operation = await DataxUI.api('/api/workbench/operations', 'post', request);
    requests.delete(fingerprint); watched.add(operation.id);
    state.running += ['QUEUED', 'RUNNING'].includes(operation.state) ? 1 : 0;
    Vue.prototype.$message.success('已提交后台处理，可继续其他操作');
    await refresh();
    return operation;
  }
  async function download(id) {
    const token = DataxModules.require('utils/auth').getToken();
    const response = await fetch('/api/workbench/exports/' + encodeURIComponent(id) + '/download', { credentials: 'same-origin', headers: { Authorization: token } });
    const disposition = response.headers.get('content-disposition') || '';
    if (!response.ok || !/attachment/i.test(disposition) || !(response.headers.get('content-type') || '').match(/application\/(zip|json)/)) {
      let message = '文件下载失败，请刷新记录后重试';
      try { message = (await response.json()).msg || message; } catch (ignored) { }
      throw new Error(message);
    }
    const match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    const name = match ? decodeURIComponent(match[1]) : 'datax-export.zip';
    const url = URL.createObjectURL(await response.blob()), anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  global.DataxWorkbench = {
    state, labels, submit, refresh, download,
    init(vue, route) { Vue = vue; router = route; Vue.observable(state); },
    start() { if (!started) { started = true; poll(); } },
    stop() { started = false; clearTimeout(timer); revision++; initialized = false; seen.clear(); watched.clear(); requests.clear(); state.records = []; state.running = 0; state.unread = 0; },
    async read(id) { await DataxUI.api('/api/workbench/notifications/read', 'post', { id: id || '' }); return refresh(); }
  };
})(window);
