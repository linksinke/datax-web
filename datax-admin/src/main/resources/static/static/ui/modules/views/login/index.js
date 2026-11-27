/* Original readable DataX Web UI source: views/login/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/login/index", function(module, exports, require) {
  const defaultExport = {
    name: 'Login',
    data() {
      return {
        loginForm: {
          username: '',
          password: '',
          rememberMe: 0
        },
        loginRules: {},
        passwordType: 'password',
        loading: false,
        redirect: undefined,
        otherQuery: {}
      }
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          this.redirect = route.query.redirect;
          this.otherQuery = Object.assign({}, route.query);
          delete this.otherQuery.redirect
        }
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "login"));
});
