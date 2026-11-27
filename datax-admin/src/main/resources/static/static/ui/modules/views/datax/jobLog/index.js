/* Original readable DataX Web UI source: views/datax/jobLog/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/jobLog/index", function(module, exports, require) {

  const log = require("api/datax-job-log");
  const job = require("api/datax-job-info");
  const wavesModule = require("directive/waves/index"); // waves directive
  const PaginationModule = require("components/Pagination/index"); // secondary package based on el-pagination

  const defaultExport = {
    name: 'JobLog',
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
        dialogVisible: false,
        list: null,
        listLoading: true,
        total: 0,
        listQuery: {
          current: 1,
          size: 10,
          jobGroup: 0,
          jobId: '',
          logStatus: -1,
          filterTime: ''
        },
        dialogPluginVisible: false,
        pluginData: [],
        dialogFormVisible: false,
        dialogStatus: '',
        executorList: '',
        textMap: {
          create: 'Clear'
        },
        rules: {},
        temp: {
          deleteType: 1,
          jobGroup: 0,
          jobId: 0
        },
        statusList: [{
          value: 500,
          label: '失败'
        }, {
          value: 502,
          label: '失败(超时)'
        }, {
          value: 200,
          label: '成功'
        }, {
          value: 0,
          label: '无'
        }],
        deleteTypeList: [{
          value: 1,
          label: '清理一个月之前日志数据'
        }, {
          value: 2,
          label: '清理三个月之前日志数据'
        }, {
          value: 3,
          label: '清理六个月之前日志数据'
        }, {
          value: 4,
          label: '清理一年之前日志数据'
        }, {
          value: 5,
          label: '清理一千条以前日志数据'
        }, {
          value: 6,
          label: '清理一万条以前日志数据'
        }, {
          value: 7,
          label: '清理三万条以前日志数据'
        }, {
          value: 8,
          label: '清理十万条以前日志数据'
        }, {
          value: 9,
          label: '清理所有日志数据'
        }],
        logStatusList: [{
          value: -1,
          label: '全部'
        }, {
          value: 1,
          label: '成功'
        }, {
          value: 2,
          label: '失败'
        }, {
          value: 3,
          label: '进行中'
        }],
        // 日志查询参数
        jobLogQuery: {
          executorAddress: '',
          triggerTime: '',
          id: '',
          fromLineNum: 1
        },
        // 日志内容
        logContent: '',
        // 显示日志
        logShow: false,
        // 日志显示加载中效果
        logLoading: false
      }
    },
    created() {
      this.fetchData()
      this.getExecutor()
    },

    methods: {
      fetchData() {
        this.listLoading = true
        const param = Object.assign({}, this.listQuery)
        const urlJobId = this.$route.query.jobId
        if (urlJobId > 0 && !param.jobId) {
          param.jobId = urlJobId
        } else if (!urlJobId && !param.jobId) {
          param.jobId = 0
        }
        log.getList(param).then(response => {
          const {
            content
          } = response
          this.total = content.recordsTotal
          this.list = content.data
          this.listLoading = false
        })
      },
      getExecutor() {
        job.getExecutorList().then(response => {
          const {
            content
          } = response
          this.executorList = content
          const defaultParam = {
            id: 0,
            title: '全部'
          }
          this.executorList.unshift(defaultParam)
          this.listQuery.jobGroup = this.executorList[0].id
        })
      },
      handlerDelete() {
        this.dialogStatus = 'create'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      deleteLog() {
        log.clearLog(this.temp.jobGroup, this.temp.jobId, this.temp.deleteType).then(response => {
          this.fetchData()
          this.dialogFormVisible = false
          this.$notify({
            title: 'Success',
            message: 'Delete Successfully',
            type: 'success',
            duration: 2000
          })
        })
        // const index = this.list.indexOf(row)
      },
      // 查看日志
      handleViewJobLog(row) {
        // const str = location.href.split('#')[0]
        // window.open(`${str}#/ router的name `)
        this.dialogVisible = true

        this.jobLogQuery.executorAddress = row.executorAddress
        this.jobLogQuery.id = row.id
        this.jobLogQuery.triggerTime = Date.parse(row.triggerTime)
        if (this.logShow === false) {
          this.logShow = true
        }
        // window.open(`#/data/log?executorAddress=${this.jobLogQuery.executorAddress}&triggerTime=${this.jobLogQuery.triggerTime}&id=${this.jobLogQuery.id}&fromLineNum=${this.jobLogQuery.fromLineNum}`)
        this.loadLog()
      },
      // 获取日志
      loadLog() {
        this.logLoading = true
        log.viewJobLog(this.jobLogQuery.executorAddress, this.jobLogQuery.triggerTime, this.jobLogQuery.id,
          this.jobLogQuery.fromLineNum).then(response => {
          // 判断是否是 '\n'，如果是表示显示完成，不重新加载
          if (response.content.logContent === '\n') {
            // this.jobLogQuery.fromLineNum = response.toLineNum - 20;
            // 重新加载
            // setTimeout(() => {
            //   this.loadLog()
            // }, 2000);
          } else {
            this.logContent = response.content.logContent
          }
          this.logLoading = false
        })
      },
      killRunningJob(row) {
        log.killJob(row).then(response => {
          this.fetchData()
          this.dialogFormVisible = false
          this.$notify({
            title: 'Success',
            message: 'Kill Successfully',
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "logs"));
});
