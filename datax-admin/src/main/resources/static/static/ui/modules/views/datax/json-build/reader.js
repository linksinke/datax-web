/* Original readable DataX Web UI source: views/datax/json-build/reader; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/reader", function(module, exports, require) {

  const RDBMSReaderModule = require("views/datax/json-build/reader/RDBMSReader");
  const HiveReaderModule = require("views/datax/json-build/reader/HiveReader");
  const HBaseReaderModule = require("views/datax/json-build/reader/HBaseReader");
  const MongoDBReaderModule = require("views/datax/json-build/reader/MongoDBReader");
  const defaultExport = {
    name: 'Reader',
    components: {
      RDBMSReader: RDBMSReaderModule.default,
      HiveReader: HiveReaderModule.default,
      HBaseReader: HBaseReaderModule.default,
      MongoDBReader: MongoDBReaderModule.default
    },
    data() {
      return {
        dataSource: ''
      }
    },
    methods: {
      getData() {
        if (this.dataSource === 'hive') {
          return this.$refs.hivereader.getData()
        } else if (this.dataSource === 'hbase') {
          return this.$refs.hbasereader.getData()
        } else if (this.dataSource === 'mongodb') {
          return this.$refs.mongodbreader.getData()
        } else {
          return this.$refs.rdbmsreader.getData()
        }
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/reader"));
  defaultExport._scopeId = "data-source-e351625d";
});
