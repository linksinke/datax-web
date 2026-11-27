/* Original readable DataX Web UI source: views/error-page/404; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/error-page/404", function(module, exports, require) {
  const defaultExport = {
    name: 'NotFound'
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "not-found"));
});
