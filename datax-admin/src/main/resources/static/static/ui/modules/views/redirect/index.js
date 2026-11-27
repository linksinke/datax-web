/* Original readable DataX Web UI source: views/redirect/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/redirect/index", function(module, exports, require) {

  const defaultExport = {
    created() {
      const {
        params,
        query
      } = this.$route
      const {
        path
      } = params
      this.$router.replace({
        path: '/' + path,
        query
      })
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
