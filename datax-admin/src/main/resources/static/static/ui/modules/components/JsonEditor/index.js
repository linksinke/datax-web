/* Original readable DataX Web UI source: components/JsonEditor/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/JsonEditor/index", function(module, exports, require) {
  const defaultExport = DataxModules.require('datax-config-template').JsonCodeEditor
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/JsonEditor/index"));
  defaultExport._scopeId = "data-source-2cd181f2";
});
