/* Original readable DataX Web UI source: views/datax/json-build-batch/mapper; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/mapper", function(module, exports, require) {

  const TableMapperModule = require("views/datax/json-build-batch/components/tableMapper");
  const defaultExport = {
    name: 'Mapper',
    components: {
      TableMapper: TableMapperModule.default
    },
    methods: {
      sendTables(fromTablesList, toTablesList) {
        this.$refs.mapper.fromTablesList = fromTablesList
        this.$refs.mapper.toTablesList = toTablesList
      },
      getLTables() {
        return this.$refs.mapper.getLTables()
      },
      getRTables() {
        return this.$refs.mapper.getRTables()
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build-batch/mapper"));
  defaultExport._scopeId = "data-source-2a5b028f";
});
