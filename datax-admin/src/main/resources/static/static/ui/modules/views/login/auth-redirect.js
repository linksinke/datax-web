/* Original readable DataX Web UI source: views/login/auth-redirect; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/login/auth-redirect", function(module, exports, require) {

  const defaultExport = {
    name: 'AuthRedirect',
    created() {
      const hash = window.location.search.slice(1)
      if (window.localStorage) {
        window.localStorage.setItem('x-admin-oauth-code', hash)
        window.close()
      }
    },
    render: function(h) {
      return h() // avoid warning message
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
