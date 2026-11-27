/* Original readable DataX Web UI source: views/datax/json-build/writer/HiveWriter; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/writer/HiveWriter", function(module, exports, require) {

  const dsQueryApi = require("api/metadata-query");
  const datax_jdbcDatasourceModule = require("api/datax-jdbcDatasource");
  const BusModule = require("views/datax/json-build/busWriter");
  const defaultExport = {
    name: 'HiveWriter',
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
          tableName: '',
          columns: [],
          checkAll: false,
          isIndeterminate: true,
          ifCreateTable: false,
          defaultFS: '',
          fileType: '',
          path: '',
          fileName: '',
          writeMode: '',
          fieldDelimiter: ''
        },
        rules: {
          path: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          defaultFS: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          fileName: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          fileType: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'change'
          }],
          writeMode: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'change'
          }],
          fieldDelimiter: [{
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
        readerForm: this.getReaderData(),
        fileTypes: [{
          value: 'text',
          label: 'text'
        }, {
          value: 'orc',
          label: 'orc'
        }],
        writeModes: [{
          value: 'append',
          label: 'append 写入前不做任何处理'
        }, {
          value: 'nonConflict',
          label: 'nonConflict 目录下有fileName前缀的文件，直接报错'
        }]
      }
    },
    watch: {
      'writerForm.datasourceId': function(oldVal, newVal) {
        this.getTables('hiveWriter')
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
        if (type === 'hiveWriter') {
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
      },
      createTable() {
        const tableName = this.fromTableName
        const datasourceId = this.writerForm.datasourceId
        const columns = this.fromColumnList
        const jsonString = {}
        jsonString['datasourceId'] = datasourceId
        jsonString['tableName'] = tableName
        jsonString['columns'] = columns
        console.info(jsonString)
        dsQueryApi.createTable(jsonString).then(response => {
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/writer/HiveWriter"));
  defaultExport._scopeId = "data-source-c26e4aaf";
});
