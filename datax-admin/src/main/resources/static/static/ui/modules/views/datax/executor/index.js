/* Original readable DataX Web UI source: views/datax/executor/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/executor/index", function(module, exports, require) {

  const executor = require("api/datax-executor");
  const wavesModule = require("directive/waves/index"); // waves directive
  const PaginationModule = require("components/Pagination/index"); // secondary package based on el-pagination

  const defaultExport = {
    name: 'Executor',
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
          size: 10,
          name: undefined,
          jobGroup: undefined
        },
        editJsonVisible: false,
        pluginData: [],
        dialogFormVisible: false,
        dialogStatus: '',
        textMap: {
          update: 'Edit',
          create: 'Create'
        },
        rules: {
          appName: [{
            required: true,
            message: 'appName is required',
            trigger: 'blur'
          }],
          title: [{
            required: true,
            message: 'title is required',
            trigger: 'blur'
          }],
          order: [{
            required: true,
            message: 'title is required',
            trigger: 'blur'
          }],
          addressType: [{
            required: true,
            message: 'title is required',
            trigger: 'change'
          }]
        },
        temp: {
          id: undefined,
          appName: undefined,
          title: undefined,
          order: undefined,
          addressType: undefined,
          addressList: undefined
        },
        addressTypes: [{
          value: 0,
          label: '自动注册'
        }, {
          value: 1,
          label: '手动录入'
        }]
      }
    },
    created() {
      this.fetchData()
    },
    methods: {
      fetchData() {
        this.listLoading = true
        executor.getList().then(response => {
          const {
            content
          } = response
          this.list = content
          this.listLoading = false
        })
      },
      resetTemp() {
        this.temp = {
          id: undefined,
          appName: undefined,
          title: undefined,
          order: undefined,
          addressType: undefined,
          addressList: undefined
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
            executor.created(this.temp).then(() => {
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
      handleUpdate(row) {
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
            tempData.configJson = this.configJson
            executor.updated(tempData).then(() => {
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
      handleDelete(row) {
        executor.deleted(row.id).then(response => {
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
        executor.fetch(id).then(response => {
          this.pluginData = response
          this.dialogPvVisible = true
        })
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "executors"));
});
