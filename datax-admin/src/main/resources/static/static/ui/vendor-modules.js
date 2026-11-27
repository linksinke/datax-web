/* Names used by application imports; third-party implementation files are isolated in vendor/. */
(function () {
  const globals = {
    vue: 'Vue', 'vue-router': 'VueRouter', vuex: 'Vuex', axios: 'axios',
    'js-cookie': 'Cookies', echarts: 'echarts', codemirror: 'CodeMirror',
    clipboard: 'ClipboardJS', nprogress: 'NProgress'
  };
  Object.keys(globals).forEach(function (name) {
    DataxModules.define(name, function (module, exports) {
      const library = window[globals[name]];
      if (!library) throw new Error('依赖未加载：' + name);
      exports.default = library;
      Object.keys(library).forEach(function (key) { exports[key] = library[key]; });
    });
  });
  DataxModules.define('element-ui', function (module, exports, require) {
    const library = require('vendor/element-ui');
    exports.default = library;
    Object.keys(library).forEach(function (name) { exports[name] = library[name]; });
  });
  DataxModules.define('path', function (module, exports) {
    function resolve() {
      const parts = [];
      Array.from(arguments).forEach(function (path) {
        if (path.startsWith('/')) parts.length = 0;
        path.split('/').forEach(function (part) {
          if (part === '..') parts.pop();
          else if (part && part !== '.') parts.push(part);
        });
      });
      return '/' + parts.join('/');
    }
    exports.default = { resolve };
  });
  DataxModules.define('styles/variables', function (module, exports) {
    exports.default = { menuBg: '#193247', menuText: '#d5e2ed', menuActiveText: '#ffffff', theme: '#2469c9' };
  });
  DataxModules.define('styles/element-variables', function (module, exports) {
    exports.default = { theme: '#2469c9' };
  });
})(window);
