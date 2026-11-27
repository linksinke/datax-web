/* Original readable DataX Web UI source: settings; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("settings", function(module, exports, require) {
  const defaultExport = {
    title: 'DataX Web',
    showSettings: false,
    tagsView: true,
    fixedHeader: true,
    sidebarLogo: true,
    errorLog: false
  }
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
