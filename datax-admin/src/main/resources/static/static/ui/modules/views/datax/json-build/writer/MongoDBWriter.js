/* Original readable DataX Web UI source: views/datax/json-build/writer/MongoDBWriter; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/writer/MongoDBWriter", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build/busWriter");
  const defaultExport = {
    name: 'MongoDBWriter',
    data() {
      return {
        jdbcDsQuery: {
          current: 1,
          size: 200
        },
        wDsList: [],
        fromTableName: '',
        fromColumnList: [],
        wTbList: [],
        dataSource: '',
        writerForm: {
          datasourceId: undefined,
          columns: [],
          tableName: '',
          checkAll: false,
          isIndeterminate: true,
          ifCreateTable: false,
          upsertInfo: {
            isUpsert: '',
            upsertKey: ''
          }
        },
        upsertType: [{
          value: true,
          label: '针对相同的upsertKey做更新'
        }, {
          value: false,
          label: '不做更新'
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
          fromTableName: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }]
        },
        readerForm: this.getReaderData()
      }
    },
    watch: {
      'writerForm.datasourceId': function(oldVal, newVal) {
        this.getTables('mongodbWriter')
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
          this.wDsList = records
          this.loading = false
        })
      },
      // 获取表名
      getTables(type) {
        if (type === 'mongodbWriter') {
          const obj = {
            datasourceId: this.writerForm.datasourceId
          }
          // 组装
          dsQueryApi.getTables(obj).then(response => {
            this.wTbList = response
          })
        }
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
      createTableCheckedChange(val) {
        this.writerForm.tableName = val ? this.readerForm.tableName : ''
        this.fromColumnList = this.readerForm.columns
        this.writerForm.columns = this.readerForm.columns
        this.writerForm.checkAll = true
        this.writerForm.isIndeterminate = false
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
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/writer/MongoDBWriter"));
  defaultExport._scopeId = "data-source-3dcc5b1f";
});
