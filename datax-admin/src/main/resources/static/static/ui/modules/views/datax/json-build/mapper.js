/* Original readable DataX Web UI source: views/datax/json-build/mapper; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/mapper", function(module, exports, require) {

  const FieldMapperModule = require("views/datax/json-build/components/fieldMapper");
  const defaultExport = {
    name: 'Mapper',
    components: {
      FieldMapper: FieldMapperModule.default
    },
    methods: {
      sendColumns(fromColumnsList, toColumnsList) {
        this.$refs.mapper.fromColumnsList = fromColumnsList
        this.$refs.mapper.toColumnsList = toColumnsList
      },
      getLColumns() {
        return this.$refs.mapper.getLColumns()
      },
      getRColumns() {
        return this.$refs.mapper.getRColumns()
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/mapper"));
  defaultExport._scopeId = "data-source-88000e86";
});
