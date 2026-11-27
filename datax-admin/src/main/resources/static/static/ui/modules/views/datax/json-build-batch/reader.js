/* Original readable DataX Web UI source: views/datax/json-build-batch/reader; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/reader", function(module, exports, require) {

  const TableReaderModule = require("views/datax/json-build-batch/reader/tableReader");
  const defaultExport = {
    name: 'Reader',
    components: {
      TableReader: TableReaderModule.default
    },
    data() {
      return {
        dataSource: ''
      }
    },
    methods: {
      getData() {
        return this.$refs.tablereader.getData()
      },
      showDataSource(data) {
        this.dataSource = data
        this.getData()
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build-batch/reader"));
  defaultExport._scopeId = "data-source-69d82bc1";
});
