/* Original readable DataX Web UI source: directive/waves/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("directive/waves/index", function(module, exports, require) {
  const wavesModule = require("directive/waves/waves");

  const install = function(Vue) {
    Vue.directive('waves', wavesModule.default)
  }

  if (window.Vue) {
    window.waves = wavesModule.default
    Vue.use(install); // eslint-disable-line
  }

  wavesModule.default.install = install
  const defaultExport = wavesModule.default

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
