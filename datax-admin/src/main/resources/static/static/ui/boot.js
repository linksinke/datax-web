/* Loads local Vue HTML and named modules directly in the browser. No Node.js or bundler. */
(function () {
  'use strict';
  const manifest = window.DataxManifest;
  const status = document.getElementById('boot-status');

  function script(url) {
    return new Promise((resolve, reject) => {
      const element = document.createElement('script');
      const timer = setTimeout(() => { element.remove(); reject(new Error('资源加载超时：' + url)); }, 30000);
      element.src = url;
      element.onload = () => { clearTimeout(timer); resolve(); };
      element.onerror = () => { clearTimeout(timer); reject(new Error('资源加载失败：' + url)); };
      document.head.appendChild(element);
    });
  }

  async function templates() {
    await Promise.all(Object.keys(manifest.views).map(async name => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(manifest.views[name], { credentials: 'same-origin', cache: 'no-cache', signal: controller.signal });
        if (!response.ok) throw new Error('页面模板加载失败：' + name);
        DataxUI.templates[name] = await response.text();
      } finally { clearTimeout(timer); }
    }));
  }

  async function start() {
    await script(manifest.vue);
    window.Vue.config.productionTip = false;
    window.Vue.config.devtools = false;
    window.DataxCompile = window.Vue.compile;
    await Promise.all([templates(), ...manifest.vendorScripts.map(script)]);
    await Promise.all(manifest.editorModes.map(script));
    await Promise.all(manifest.modules.map(script));
    await script(manifest.app);
    status.remove();
  }

  start().catch(error => {
    status.removeAttribute('aria-busy');
    status.className = 'boot-failed';
    status.innerHTML = '<strong>工作台暂时未能加载</strong><p>请检查网络连接后重试。</p><button type="button">重新加载</button>';
    status.querySelector('button').onclick = () => location.reload();
    console.error(error);
  });
})();
