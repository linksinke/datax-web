/* Original readable DataX Web UI source: views/datax/json-build-batch/reader/tableReader; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/reader/tableReader", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build-batch/busReader");

  const defaultExport = {
    name: 'TableReader',
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
        loading: false,
        active: 1,
        customFields: '',
        customType: '',
        customValue: '',
        dataSource: '',
        readerForm: {
          datasourceId: undefined,
          tables: [],
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
          }]
        }
      }
    },
    watch: {
      'readerForm.datasourceId': function(oldVal, newVal) {
        if (this.dataSource === 'postgresql' || this.dataSource === 'oracle' || this.dataSource === 'sqlserver') {
          this.getSchema()
        } else {
          this.getTables('reader')
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
          this.rDsList = records
          this.loading = false
        })
      },
      // 获取表名
      getTables(type) {
        if (type === 'reader') {
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
        this.getTables('reader')
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
        // 获取可用表
        this.getTables('reader')
      },
      rHandleCheckAllChange(val) {
        this.readerForm.tables = val ? this.rTbList : []
        this.readerForm.isIndeterminate = false
      },
      rHandleCheckedChange(value) {
        const checkedCount = value.length
        this.readerForm.checkAll = checkedCount === this.rTbList.length
        this.readerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.rTbList.length
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build-batch/reader/tableReader"));
  defaultExport._scopeId = "data-source-0fd8c779";
});
