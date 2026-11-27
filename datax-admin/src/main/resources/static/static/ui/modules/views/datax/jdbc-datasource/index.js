/* Original readable DataX Web UI source: views/datax/jdbc-datasource/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/jdbc-datasource/index", function(module, exports, require) {

  const datasourceApi = require("api/datax-jdbcDatasource");
  const wavesModule = require("directive/waves/index"); // waves directive
  const indexModule = require("utils/index");
  const PaginationModule = require("components/Pagination/index");

  const defaultExport = {
    name: 'JdbcDatasource',
    components: {
      Pagination: PaginationModule.default
    },
    directives: {
      waves: wavesModule.default
    },
    filters: {
      statusFilter(status) {
        const statusMap = {
          published: 'success',
          draft: 'gray',
          deleted: 'danger'
        }
        return statusMap[status]
      }
    },
    data() {
      return {
        list: null,
        listLoading: true,
        total: 0,
        listQuery: {
          current: 1,
          size: 10
        },
        pluginTypeOptions: ['reader', 'writer'],
        dialogPluginVisible: false,
        pluginData: [],
        dialogFormVisible: false,
        dialogStatus: '',
        textMap: {
          update: 'Edit',
          create: 'Create'
        },
        rules: {
          datasourceName: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          jdbcUsername: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          jdbcPassword: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          jdbcUrl: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          jdbcDriverClass: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          datasource: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'change'
          }],
          zkAdress: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }],
          databaseName: [{
            required: true,
            message: '请填写或选择此项',
            trigger: 'blur'
          }]
        },
        temp: {
          id: undefined,
          datasourceName: '',
          datasourceGroup: 'Default',
          jdbcUsername: '',
          jdbcPassword: '',
          jdbcUrl: '',
          jdbcDriverClass: '',
          comments: '',
          datasource: '',
          zkAdress: '',
          databaseName: ''
        },
        visible: true,
        dataSources: [{
          value: 'mysql',
          label: 'mysql'
        }, {
          value: 'oracle',
          label: 'oracle'
        }, {
          value: 'postgresql',
          label: 'postgresql'
        }, {
          value: 'sqlserver',
          label: 'sqlserver'
        }, {
          value: 'hive',
          label: 'hive'
        }, {
          value: 'hbase',
          label: 'hbase'
        }, {
          value: 'mongodb',
          label: 'mongodb'
        }, {
          value: 'clickhouse',
          label: 'clickhouse'
        }],
        jdbc: true,
        hbase: false,
        mongodb: false
      }
    },
    created() {
      this.fetchData()
    },
    methods: {
      selectDataSource(datasource) {
        if (datasource === 'mysql') {
          this.temp.jdbcUrl = 'jdbc:mysql://{host}:{port}/{database}'
          this.temp.jdbcDriverClass = 'com.mysql.jdbc.Driver'
        } else if (datasource === 'oracle') {
          this.temp.jdbcUrl = 'jdbc:oracle:thin:@//{host}:{port}/{database}'
          this.temp.jdbcDriverClass = 'oracle.jdbc.OracleDriver'
        } else if (datasource === 'postgresql') {
          this.temp.jdbcUrl = 'jdbc:postgresql://{host}:{port}/{database}'
          this.temp.jdbcDriverClass = 'org.postgresql.Driver'
        } else if (datasource === 'sqlserver') {
          this.temp.jdbcUrl = 'jdbc:sqlserver://{host}:{port};DatabaseName={database}'
          this.temp.jdbcDriverClass = 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
        } else if (datasource === 'clickhouse') {
          this.temp.jdbcUrl = 'jdbc:clickhouse://{host}:{port}/{database}'
          this.temp.jdbcDriverClass = 'ru.yandex.clickhouse.ClickHouseDriver'
        } else if (datasource === 'hive') {
          this.temp.jdbcUrl = 'jdbc:hive2://{host}:{port}/{database}'
          this.temp.jdbcDriverClass = 'org.apache.hive.jdbc.HiveDriver'
          this.hbase = this.mongodb = false
          this.jdbc = true
        }
        this.getShowStrategy(datasource)
      },
      fetchData() {
        this.listLoading = true
        datasourceApi.list(this.listQuery).then(response => {
          const {
            records
          } = response
          const {
            total
          } = response
          this.total = total
          this.list = records
          this.listLoading = false
        })
      },
      resetTemp() {
        this.temp = {
          id: undefined,
          datasourceName: '',
          datasourceGroup: 'Default',
          jdbcUsername: '',
          jdbcPassword: '',
          jdbcUrl: '',
          jdbcDriverClass: '',
          comments: ''
        }
      },
      handleCreate() {
        this.resetTemp()
        this.dialogStatus = 'create'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      createData() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            datasourceApi.created(this.temp).then(() => {
              this.fetchData()
              this.dialogFormVisible = false
              this.$notify({
                title: 'Success',
                message: 'Created Successfully',
                type: 'success',
                duration: 2000
              })
            })
          }
        })
      },
      testDataSource() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            datasourceApi.test(this.temp).then(response => {
              if (response.data === false) {
                this.$notify({
                  title: 'Fail',
                  message: response.data.msg,
                  type: 'fail',
                  duration: 2000
                })
              } else {
                this.$notify({
                  title: 'Success',
                  message: 'Tested Successfully',
                  type: 'success',
                  duration: 2000
                })
              }
            })
          }
        })
      },
      handleUpdate(row) {
        this.getShowStrategy(row.datasource)
        this.temp = Object.assign({}, row) // copy obj
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      updateData() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            const tempData = Object.assign({}, this.temp)
            datasourceApi.updated(tempData).then(() => {
              this.fetchData()
              this.dialogFormVisible = false
              this.$notify({
                title: 'Success',
                message: 'Update Successfully',
                type: 'success',
                duration: 2000
              })
            })
          }
        })
      },
      getShowStrategy(datasource) {
        if (datasource === 'hbase') {
          this.jdbc = this.mongodb = false
          this.hbase = true
        } else if (datasource === 'mongodb') {
          this.jdbc = this.hbase = false
          this.mongodb = true
          this.temp.jdbcUrl = 'mongodb://[username:password@]host1[:port1][,...hostN[:portN]]][/[database][?options]]'
        } else {
          this.hbase = this.mongodb = false
          this.jdbc = true
        }
      },
      handleDelete(row) {
        console.log('删除')
        const idList = []
        idList.push(row.id)
        // 拼成 idList=xx
        // 多个比较麻烦，这里不处理
        datasourceApi.deleted({
          idList: row.id
        }).then(response => {
          this.fetchData()
          this.$notify({
            title: 'Success',
            message: 'Delete Successfully',
            type: 'success',
            duration: 2000
          })
        })
        // const index = this.list.indexOf(row)
      },
      handleFetchPv(id) {
        datasourceApi.fetched(id).then(response => {
          this.pluginData = response
          this.dialogPvVisible = true
        })
      },
      formatJson(filterVal, jsonData) {
        return jsonData.map(v => filterVal.map(j => {
          if (j === 'timestamp') {
            return indexModule.parseTime(v[j])
          } else {
            return v[j]
          }
        }))
      },
      changePass(value) {
        this.visible = !(value === 'show')
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "datasources"));

  const originalData = defaultExport.data;
  defaultExport.data = function() {
    return Object.assign(originalData.call(this), {
      datasourceSaving: false,
      datasourceTesting: false,
      connectionResult: null
    });
  };
  const datasourceForm = require('datax-datasource-form');
  Object.assign(defaultExport.methods, {
    createData() {
      return datasourceForm.save(this, 'post');
    },
    updateData() {
      return datasourceForm.save(this, 'put');
    },
    testDataSource() {
      return datasourceForm.testConnection(this);
    },
    handleCreate() {
      this.temp = this.$options.data.call(this).temp;
      this.temp.datasource = 'mysql';
      this.temp.status = 1;
      this.selectDataSource('mysql');
      this.dialogStatus = 'create';
      this.dialogFormVisible = true;
      this.connectionResult = null;
      this.$nextTick(() => this.$refs.dataForm && this.$refs.dataForm.clearValidate());
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row);
      this.dialogStatus = 'update';
      this.dialogFormVisible = true;
      this.connectionResult = null;
      this.$nextTick(() => this.$refs.dataForm && this.$refs.dataForm.clearValidate());
    }
  });
});
