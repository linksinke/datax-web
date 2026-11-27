/* Original readable DataX Web UI source: store/modules/user; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("store/modules/user", function(module, exports, require) {
  const userModule = require("api/user");
  const authModule = require("utils/auth");
  const routerModule = require("router/index");

  const state = {
    token: authModule.getToken(),
    name: '',
    avatar: '',
    introduction: '',
    roles: []
  }

  const mutations = {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_INTRODUCTION: (state, introduction) => {
      state.introduction = introduction
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    }
  }

  const actions = {
    // user login
    login({
      commit
    }, userInfo) {
      const {
        username,
        password,
        rememberMe
      } = userInfo
      return new Promise((resolve, reject) => {
        userModule.login({
          username: username.trim(),
          password: password,
          rememberMe: rememberMe || 0
        }).then(response => {
          const {
            data
          } = response.content
          const {
            roles
          } = response.content
          commit('SET_TOKEN', data)
          commit('SET_NAME', username.trim())
          localStorage.setItem('dataxUsername', username.trim())
          localStorage.setItem('roles', JSON.stringify(roles))
          authModule.setToken(data)
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    // get user info
    getInfo({
      commit,
      state
    }) {
      return new Promise((resolve, reject) => {
        const data = {}
        data.roles = JSON.parse(localStorage.getItem('roles') || '[]')
        commit('SET_NAME', localStorage.getItem('dataxUsername') || '')
        commit('SET_ROLES', data.roles)
        resolve(data)
      })
    },

    // user logout
    logout({
      commit,
      state
    }) {
      // return new Promise((resolve, reject) => {
      //   logout(state.token).then(() => {
      //     commit('SET_TOKEN', '')
      //     commit('SET_ROLES', [])
      //     removeToken()
      //     resetRouter()
      //     resolve()
      //   }).catch(error => {
      //     reject(error)
      //   })
      // })
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        authModule.removeToken()
        routerModule.resetRouter()
        resolve()
      })
    },

    // remove token
    resetToken({
      commit
    }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        authModule.removeToken()
        resolve()
      })
    },

    // dynamically modify permissions
    changeRoles({
      commit,
      dispatch
    }, role) {
      return new Promise(async resolve => {
        const token = role + '-token'

        commit('SET_TOKEN', token)
        authModule.setToken(token)

        const {
          roles
        } = await dispatch('getInfo')

        routerModule.resetRouter()

        // generate accessible routes map based on roles
        const accessRoutes = await dispatch('permission/generateRoutes', roles, {
          root: true
        })

        // dynamically add accessible routes
        routerModule.default.addRoutes(accessRoutes)

        // reset visited views and cached views
        dispatch('tagsView/delAllViews', null, {
          root: true
        })

        resolve()
      })
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
