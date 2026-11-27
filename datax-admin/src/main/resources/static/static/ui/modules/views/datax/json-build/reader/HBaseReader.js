/* Original readable DataX Web UI source: views/datax/json-build/reader/HBaseReader; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/reader/HBaseReader", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build/busReader");

  const defaultExport = {
    name: 'HBaseReader',
    data() {
      return {
        jdbcDsQuery: {
          current: 1,
          size: 200
        },
        rDsList: [],
        rTbList: [],
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
          checkAll: false,
          isIndeterminate: true,
          mode: '',
          maxVersion: '',
          range: {
            startRowkey: '',
            endRowkey: '',
            isBinaryRowkey: ''
          }
        },
        modeTypes: [{
          value: 'normal',
          label: 'normal'
        }, {
          value: 'multiVersionFixedColumn',
          label: 'multiVersionFixedColumn'
        }],
        binaryRowkeyTypes: [{
          value: 'true',
          label: '调用Bytes.toBytesBinary(rowkey)'
        }, {
          value: 'false',
          label: '调用Bytes.toBytes(rowkey)'
        }],
        rules: {
          mode: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          datasourceId: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          tableName: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }]
        }
      }
    },
    watch: {
      'readerForm.datasourceId': function(oldVal, newVal) {
        this.getTables('hbaseReader')
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
        if (type === 'hbaseReader') {
          const obj = {
            datasourceId: this.readerForm.datasourceId
          }
          // 组装
          dsQueryApi.getTables(obj).then(response => {
            this.rTbList = response
          })
        }
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
          this.getTableColumns()
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/reader/HBaseReader"));
  defaultExport._scopeId = "data-source-7a25293c";
});
