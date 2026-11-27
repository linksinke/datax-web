/* Original readable DataX Web UI source: views/datax/json-build/writer/RDBMSWriter; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/writer/RDBMSWriter", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build/busWriter");
  const defaultExport = {
    name: 'RDBMSWriter',
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
        fromColumnList: [],
        wTbList: [],
        dataSource: '',
        createTableName: '',
        writerForm: {
          datasourceId: undefined,
          tableName: '',
          columns: [],
          checkAll: false,
          isIndeterminate: true,
          preSql: '',
          postSql: '',
          ifCreateTable: false,
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
          }],
          tableSchema: [{
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
          this.getTables('rdbmsWriter')
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
        if (type === 'rdbmsWriter') {
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
        this.getTables('rdbmsWriter')
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
      },
      // 获取表字段
      getColumns() {
        const obj = {
          datasourceId: this.writerForm.datasourceId,
          tableName: this.writerForm.tableName
        }
        dsQueryApi.getColumns(obj).then(response => {
          this.fromColumnList = response
          this.writerForm.columns = response
          this.writerForm.checkAll = true
          this.writerForm.isIndeterminate = false
        })
      },
      // 表切换
      wTbChange(t) {
        this.writerForm.tableName = t
        this.fromColumnList = []
        this.writerForm.columns = []
        this.getColumns('writer')
      },
      wHandleCheckAllChange(val) {
        this.writerForm.columns = val ? this.fromColumnList : []
        this.writerForm.isIndeterminate = false
      },
      wHandleCheckedChange(value) {
        const checkedCount = value.length
        this.writerForm.checkAll = checkedCount === this.fromColumnList.length
        this.writerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.fromColumnList.length
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/writer/RDBMSWriter"));
  defaultExport._scopeId = "data-source-168455fc";
});
