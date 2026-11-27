/* Original readable DataX Web UI source: store/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("store/index", function(module, exports, require) {
  const VueModule = require("vue");
  const VuexModule = require("vuex");
  const gettersModule = require("store/getters");
  const appModule = require("store/modules/app");
  const errorLogModule = require("store/modules/errorLog");
  const permissionModule = require("store/modules/permission");
  const settingsModule = require("store/modules/settings");
  const tagsViewModule = require("store/modules/tagsView");
  const userModule = require("store/modules/user");
  VueModule.default.use(VuexModule.default)
  const defaultExport = new VuexModule.default.Store({
    modules: {
      app: appModule.default,
      errorLog: errorLogModule.default,
      permission: permissionModule.default,
      settings: settingsModule.default,
      tagsView: tagsViewModule.default,
      user: userModule.default
    },
    getters: gettersModule.default
  })

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
