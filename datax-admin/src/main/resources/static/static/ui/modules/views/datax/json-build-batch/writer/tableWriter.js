/* Original readable DataX Web UI source: views/datax/json-build-batch/writer/tableWriter; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/writer/tableWriter", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build-batch/busWriter");
  const defaultExport = {
    name: 'TableWriter',
    data() {
      return {
        jdbcDsQuery: {
          current: 1,
          size: 200,
          ascs: 'datasource_name'
        },
        wDsList: [],
        schemaList: [],
        fromTableName: '',
        wTbList: [],
        dataSource: '',
        createTableName: '',
        writerForm: {
          datasourceId: undefined,
          tables: [],
          checkAll: false,
          isIndeterminate: true,
          tableSchema: ''
        },
        readerForm: this.getReaderData(),
        rules: {
          datasourceId: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'change'
          }],
          tableName: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'change'
          }]
        }
      }
    },
    watch: {
      'writerForm.datasourceId': function(oldVal, newVal) {
        if (this.dataSource === 'postgresql' || this.dataSource === 'oracle' || this.dataSource === 'sqlserver') {
          this.getSchema()
        } else {
          this.getTables('writer')
        }
      }
    },
    created() {
      this.getJdbcDs()
    },
    methods: {
      // 获取可用数据源
      getJdbcDs() {
        this.loading = true
        datax_jdbcDatasourceModule.list(this.jdbcDsQuery).then(response => {
          const {
            records
          } = response
          this.wDsList = records
          this.loading = false
        })
      },
      // 获取表名
      getTables(type) {
        if (type === 'writer') {
          let obj = {}
          if (this.dataSource === 'postgresql' || this.dataSource === 'oracle' || this.dataSource === 'sqlserver') {
            obj = {
              datasourceId: this.writerForm.datasourceId,
              tableSchema: this.writerForm.tableSchema
            }
          } else {
            obj = {
              datasourceId: this.writerForm.datasourceId
            }
          }
          // 组装
          dsQueryApi.getTables(obj).then(response => {
            this.wTbList = response
          })
        }
      },
      getSchema() {
        const obj = {
          datasourceId: this.writerForm.datasourceId
        }
        dsQueryApi.getTableSchema(obj).then(response => {
          this.schemaList = response
        })
      },
      // schema 切换
      schemaChange(e) {
        this.writerForm.tableSchema = e
        // 获取可用表
        this.getTables('writer')
      },
      wDsChange(e) {
        // 清空
        this.writerForm.tableName = ''
        this.writerForm.datasourceId = e
        this.wDsList.find((item) => {
          if (item.id === e) {
            this.dataSource = item.datasource
          }
        })
        BusModule.default.dataSourceId = e
        this.$emit('selectDataSource', this.dataSource)
        // 获取可用表
        this.getTables()
      },
      wHandleCheckAllChange(val) {
        this.writerForm.tables = val ? this.wTbList : []
        this.writerForm.isIndeterminate = false
      },
      wHandleCheckedChange(value) {
        const checkedCount = value.length
        this.writerForm.checkAll = checkedCount === this.wTbList.length
        this.writerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.wTbList.length
      },
      getData() {
        if (BusModule.default.dataSourceId) {
          this.writerForm.datasourceId = BusModule.default.dataSourceId
        }
        return this.writerForm
      },
      getReaderData() {
        return this.$parent.getReaderData()
      },
      getTableName() {
        return this.fromTableName
      },
      createTable() {
        const obj = {
          datasourceId: this.writerForm.datasourceId,
          tableName: this.createTableName
        }
        dsQueryApi.createTable(obj).then(response => {
          this.$notify({
            title: 'Success',
            message: 'Create Table Successfully',
            type: 'success',
            duration: 2000
          })
        }).catch(() => console.log('promise catch err'))
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build-batch/writer/tableWriter"));
  defaultExport._scopeId = "data-source-bb6964f4";
});
