/* Original readable DataX Web UI source: utils/get-page-title; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("utils/get-page-title", function(module, exports, require) {
  const defaultSettingsModule = require("settings");

  const title = defaultSettingsModule.default.title || 'Vue Element Admin'

  const defaultExport = function getPageTitle(pageTitle) {
    if (pageTitle) {
      return `${pageTitle} - ${title}`
    }
    return `${title}`
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
