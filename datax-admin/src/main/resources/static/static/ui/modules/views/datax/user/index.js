/* Original readable DataX Web UI source: views/datax/user/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/user/index", function(module, exports, require) {

  const user = require("api/datax-user");
  const wavesModule = require("directive/waves/index"); // waves directive
  const PaginationModule = require("components/Pagination/index"); // secondary package based on el-pagination

  const defaultExport = {
    name: 'User',
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
          username: undefined
        },
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
        dialogPluginVisible: false,
        pluginData: [],
        dialogFormVisible: false,
        dialogStatus: '',
        textMap: {
          update: 'Edit',
          create: 'Create'
        },
        rules: {
          role: [{
            required: true,
            message: 'role is required',
            trigger: 'change'
          }],
          username: [{
            required: true,
            message: 'username is required',
            trigger: 'blur'
          }],
          password: [{
            required: false,
            message: 'password is required',
            trigger: 'blur'
          }]
        },
        temp: {
          id: undefined,
          role: '',
          username: '',
          password: '',
          permission: ''
        },
        resetTemp() {
          this.temp = this.$options.data().temp
        }
      }
    },
    created() {
      this.fetchData()
    },
    methods: {
      fetchData() {
        this.listLoading = true
        user.getList(this.listQuery).then(response => {
          const {
            content
          } = response
          this.total = content.recordsTotal
          this.list = content.data
          this.listLoading = false
        })
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
            user.createUser(this.temp).then(() => {
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
            user.updateUser(tempData).then(() => {
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
        user.deleteUser(row.id).then(response => {
          this.fetchData()
          this.$notify({
            title: 'Success',
            message: 'Delete Successfully',
            type: 'success',
            duration: 2000
          })
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "users"));
});
