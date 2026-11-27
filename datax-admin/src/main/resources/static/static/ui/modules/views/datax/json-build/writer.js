/* Original readable DataX Web UI source: views/datax/json-build/writer; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/writer", function(module, exports, require) {

  const RDBMSWriterModule = require("views/datax/json-build/writer/RDBMSWriter");
  const HiveWriterModule = require("views/datax/json-build/writer/HiveWriter");
  const HBaseWriterModule = require("views/datax/json-build/writer/HBaseWriter");
  const MongoDBWriterModule = require("views/datax/json-build/writer/MongoDBWriter");
  const defaultExport = {
    name: 'Writer',
    components: {
      RDBMSWriter: RDBMSWriterModule.default,
      HiveWriter: HiveWriterModule.default,
      HBaseWriter: HBaseWriterModule.default,
      MongoDBWriter: MongoDBWriterModule.default
    },
    data() {
      return {
        dataSource: ''
      }
    },
    methods: {
      getData() {
        if (this.dataSource === 'hive') {
          return this.$refs.hivewriter.getData()
        } else if (this.dataSource === 'hbase') {
          return this.$refs.hbasewriter.getData()
        } else if (this.dataSource === 'mongodb') {
          return this.$refs.mongodbwriter.getData()
        } else {
          return this.$refs.rdbmswriter.getData()
        }
      },
      getTableName() {
        if (this.dataSource === 'hive') {
          return this.$refs.hivewriter.getTableName()
        } else if (this.dataSource === 'hbase') {
          return this.$refs.hbasewriter.getData()
        } else if (this.dataSource === 'mongodb') {
          return this.$refs.mongodbwriter.getData()
        } else {
          return this.$refs.rdbmswriter.getTableName()
        }
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/writer"));
  defaultExport._scopeId = "data-source-a7cf143c";
});
