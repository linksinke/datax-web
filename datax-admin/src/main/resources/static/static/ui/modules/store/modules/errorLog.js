/* Original readable DataX Web UI source: store/modules/errorLog; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("store/modules/errorLog", function(module, exports, require) {
  const state = {
    logs: []
  }

  const mutations = {
    ADD_ERROR_LOG: (state, log) => {
      state.logs.push(log)
    },
    CLEAR_ERROR_LOG: (state) => {
      state.logs.splice(0)
    }
  }

  const actions = {
    addErrorLog({
      commit
    }, log) {
      commit('ADD_ERROR_LOG', log)
    },
    clearErrorLog({
      commit
    }) {
      commit('CLEAR_ERROR_LOG')
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
