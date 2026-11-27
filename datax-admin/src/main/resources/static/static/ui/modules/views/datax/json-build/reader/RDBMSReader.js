/* Original readable DataX Web UI source: views/datax/json-build/reader/RDBMSReader; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/reader/RDBMSReader", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build/busReader");

  const defaultExport = {
    name: 'RDBMSReader',
    data() {
      return {
        jdbcDsQuery: {
          current: 1,
          size: 200,
          ascs: 'datasource_name'
        },
        rDsList: [],
        rTbList: [],
        schemaList: [],
        rColumnList: [],
        loading: false,
        active: 1,
        customFields: '',
        customType: '',
        customValue: '',
        dataSource: '',
        readerForm: {
          datasourceId: undefined,
          tableName: '',
          columns: [],
          where: '',
          querySql: '',
          checkAll: false,
          isIndeterminate: true,
          splitPk: '',
          tableSchema: ''
        },
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
      'readerForm.datasourceId': function(oldVal, newVal) {
        if (this.dataSource === 'postgresql' || this.dataSource === 'oracle' || this.dataSource === 'sqlserver') {
          this.getSchema()
        } else {
          this.getTables('rdbmsReader')
        }
      }
    },
    created() {
      this.getJdbcDs()
    },
    methods: {
      // 获取可用数据源
      getJdbcDs(type) {
        this.loading = true
        datax_jdbcDatasourceModule.list(this.jdbcDsQuery).then(response => {
          const {
            records
          } = response
          this.rDsList = records
          this.loading = false
        })
      },
      // 获取表名
      getTables(type) {
        if (type === 'rdbmsReader') {
          let obj = {}
          if (this.dataSource === 'postgresql' || this.dataSource === 'oracle' || this.dataSource === 'sqlserver') {
            obj = {
              datasourceId: this.readerForm.datasourceId,
              tableSchema: this.readerForm.tableSchema
            }
          } else {
            obj = {
              datasourceId: this.readerForm.datasourceId
            }
          }
          // 组装
          dsQueryApi.getTables(obj).then(response => {
            if (response) {
              this.rTbList = response
            }
          })
        }
      },
      getSchema() {
        const obj = {
          datasourceId: this.readerForm.datasourceId
        }
        dsQueryApi.getTableSchema(obj).then(response => {
          this.schemaList = response
        })
      },
      // schema 切换
      schemaChange(e) {
        this.readerForm.tableSchema = e
        // 获取可用表
        this.getTables('rdbmsReader')
      },
      // reader 数据源切换
      rDsChange(e) {
        // 清空
        this.readerForm.tableName = ''
        this.readerForm.datasourceId = e
        this.rDsList.find((item) => {
          if (item.id === e) {
            this.dataSource = item.datasource
          }
        })
        BusModule.default.dataSourceId = e
        this.$emit('selectDataSource', this.dataSource)
      },
      getTableColumns() {
        const obj = {
          datasourceId: this.readerForm.datasourceId,
          tableName: this.readerForm.tableName
        }
        dsQueryApi.getColumns(obj).then(response => {
          this.rColumnList = response
          this.readerForm.columns = response
          this.readerForm.checkAll = true
          this.readerForm.isIndeterminate = false
        })
      },
      getColumnsByQuerySql() {
        const obj = {
          datasourceId: this.readerForm.datasourceId,
          querySql: this.readerForm.querySql
        }
        dsQueryApi.getColumnsByQuerySql(obj).then(response => {
          this.rColumnList = response
          this.readerForm.columns = response
          this.readerForm.checkAll = true
          this.readerForm.isIndeterminate = false
        })
      },
      // 获取表字段
      getColumns(type) {
        if (type === 'reader') {
          if (this.readerForm.querySql !== '') {
            this.getColumnsByQuerySql()
          } else {
            this.getTableColumns()
          }
        }
      },
      // 表切换
      rTbChange(t) {
        this.readerForm.tableName = t
        this.rColumnList = []
        this.readerForm.columns = []
        this.getColumns('reader')
      },
      rHandleCheckAllChange(val) {
        this.readerForm.columns = val ? this.rColumnList : []
        this.readerForm.isIndeterminate = false
      },
      rHandleCheckedChange(value) {
        const checkedCount = value.length
        this.readerForm.checkAll = checkedCount === this.rColumnList.length
        this.readerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.rColumnList.length
      },
      getData() {
        if (BusModule.default.dataSourceId) {
          this.readerForm.datasourceId = BusModule.default.dataSourceId
        }
        return this.readerForm
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/reader/RDBMSReader"));
  defaultExport._scopeId = "data-source-d09e53e0";
});
