/* Original readable DataX Web UI source: views/datax/json-build-batch/busReader; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/busReader", function(module, exports, require) {
  // 公共的组件，来做为中间传达的工具
  const VueModule = require("vue");
  const defaultExport = new VueModule.default({
    data() {
      return {
        dataSourceId: ''
      }
    }
  })

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
