/* Original readable DataX Web UI source: views/error-page/401; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/error-page/401", function(module, exports, require) {
  const defaultExport = {
    name: 'Forbidden'
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "forbidden"));
});
