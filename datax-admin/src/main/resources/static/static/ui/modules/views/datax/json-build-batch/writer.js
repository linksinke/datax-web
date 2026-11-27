/* Original readable DataX Web UI source: views/datax/json-build-batch/writer; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/writer", function(module, exports, require) {

  const TableWriterModule = require("views/datax/json-build-batch/writer/tableWriter");

  const defaultExport = {
    name: 'Writer',
    components: {
      TableWriter: TableWriterModule.default
    },
    data() {
      return {
        dataSource: ''
      }
    },
    methods: {
      getData() {
        return this.$refs.tablewriter.getData()
      },
      getTableName() {
        return this.$refs.tablewriter.getTableName()
      },
      getReaderData() {
        return this.$parent.getReaderData()
      },
      showDataSource(data) {
        this.dataSource = data
        this.getData()
      },
      sendTableNameAndColumns(fromTableName, fromColumnList) {
        this.$refs.hivewriter.fromTableName = fromTableName
        this.$refs.hivewriter.fromColumnList = fromColumnList
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build-batch/writer"));
  defaultExport._scopeId = "data-source-cac7ff4a";
});
