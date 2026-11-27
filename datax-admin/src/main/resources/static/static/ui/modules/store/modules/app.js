/* Original readable DataX Web UI source: store/modules/app; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("store/modules/app", function(module, exports, require) {
  const CookiesModule = require("js-cookie");

  const state = {
    sidebar: {
      opened: CookiesModule.default.get('sidebarStatus') ? !!+CookiesModule.default.get('sidebarStatus') : true,
      withoutAnimation: false
    },
    device: 'desktop',
    size: CookiesModule.default.get('size') || 'medium'
  }

  const mutations = {
    TOGGLE_SIDEBAR: state => {
      state.sidebar.opened = !state.sidebar.opened
      state.sidebar.withoutAnimation = false
      if (state.sidebar.opened) {
        CookiesModule.default.set('sidebarStatus', 1)
      } else {
        CookiesModule.default.set('sidebarStatus', 0)
      }
    },
    CLOSE_SIDEBAR: (state, withoutAnimation) => {
      CookiesModule.default.set('sidebarStatus', 0)
      state.sidebar.opened = false
      state.sidebar.withoutAnimation = withoutAnimation
    },
    TOGGLE_DEVICE: (state, device) => {
      state.device = device
    },
    SET_SIZE: (state, size) => {
      state.size = size
      CookiesModule.default.set('size', size)
    }
  }

  const actions = {
    toggleSideBar({
      commit
    }) {
      commit('TOGGLE_SIDEBAR')
    },
    closeSideBar({
      commit
    }, {
      withoutAnimation
    }) {
      commit('CLOSE_SIDEBAR', withoutAnimation)
    },
    toggleDevice({
      commit
    }, device) {
      commit('TOGGLE_DEVICE', device)
    },
    setSize({
      commit
    }, size) {
      commit('SET_SIZE', size)
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
