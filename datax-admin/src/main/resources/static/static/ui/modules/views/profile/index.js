/* Original readable DataX Web UI source: views/profile/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/profile/index", function(module, exports, require) {
  const defaultExport = {
    name: 'Profile'
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "profile"));
});
