/* Original readable DataX Web UI source: store/modules/permission; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("store/modules/permission", function(module, exports, require) {
  const indexModule = require("router/index");

  /**
   * Use meta.role to determine if the current user has permission
   * @param roles
   * @param route
   */
  function hasPermission(roles, route) {
    if (route.meta && route.meta.roles) {
      return roles.some(role => route.meta.roles.includes(role))
    } else {
      return true
    }
  }

  /**
   * Filter asynchronous routing tables by recursion
   * @param routes asyncRoutes
   * @param roles
   */
  function filterAsyncRoutes(routes, roles) {
    const res = []

    routes.forEach(route => {
      const tmp = {
        ...route
      }
      if (hasPermission(roles, tmp)) {
        if (tmp.children) {
          tmp.children = filterAsyncRoutes(tmp.children, roles)
        }
        res.push(tmp)
      }
    })

    return res
  }

  const state = {
    routes: [],
    addRoutes: []
  }

  const mutations = {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes
      state.routes = indexModule.constantRoutes.concat(routes)
    }
  }

  const actions = {
    generateRoutes({
      commit
    }, roles) {
      return new Promise(resolve => {
        let accessedRoutes
        if (roles.includes('ROLE_ADMIN')) {
          accessedRoutes = indexModule.asyncRoutes || []
        } else {
          accessedRoutes = filterAsyncRoutes(indexModule.asyncRoutes, roles)
        }
        commit('SET_ROUTES', accessedRoutes)
        resolve(accessedRoutes)
      })
    }
  }

  const defaultExport = {
    namespaced: true,
    state,
    mutations,
    actions
  }

  Object.defineProperty(exports, "filterAsyncRoutes", {
    enumerable: true,
    get: function() {
      return filterAsyncRoutes;
    }
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
