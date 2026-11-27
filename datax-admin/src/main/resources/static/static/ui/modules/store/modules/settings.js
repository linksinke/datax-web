/* Original readable DataX Web UI source: store/modules/settings; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("store/modules/settings", function(module, exports, require) {
  const variablesModule = require("styles/element-variables");
  const defaultSettingsModule = require("settings");

  const {
    showSettings,
    tagsView,
    fixedHeader,
    sidebarLogo
  } = defaultSettingsModule.default

  const state = {
    theme: variablesModule.default.theme,
    showSettings: showSettings,
    tagsView: tagsView,
    fixedHeader: fixedHeader,
    sidebarLogo: sidebarLogo
  }

  const mutations = {
    CHANGE_SETTING: (state, {
      key,
      value
    }) => {
      if (state.hasOwnProperty(key)) {
        state[key] = value
      }
    }
  }

  const actions = {
    changeSetting({
      commit
    }, data) {
      commit('CHANGE_SETTING', data)
    }
  }

  const defaultExport = {
    namespaced: true,
    state,
    mutations,
    actions
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
