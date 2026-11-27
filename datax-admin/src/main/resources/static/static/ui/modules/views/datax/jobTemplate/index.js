/* Original readable DataX Web UI source: views/datax/jobTemplate/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/jobTemplate/index", function(module, exports, require) {

  const executor = require("api/datax-executor");
  const CronModule = require("components/Cron/index");
  const jobTemp = require("api/datax-job-template");
  const wavesModule = require("directive/waves/index"); // waves directive
  const PaginationModule = require("components/Pagination/index"); // secondary package based on el-pagination
  const datasourceApi = require("api/datax-jdbcDatasource");
  const jobProjectApi = require("api/datax-job-project");
  const job = require("api/datax-job-info");

  const defaultExport = {
    name: 'JobTemplate',
    components: {
      Pagination: PaginationModule.default,
      Cron: CronModule.default
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
      const validateIncParam = (rule, value, callback) => {
        if (!value) {
          callback(new Error('Increment parameters is required'))
        }
        callback()
      }
      const validatePartitionParam = (rule, value, callback) => {
        if (!this.partitionField) {
          callback(new Error('Partition parameters is required'))
        }
        callback()
      }
      return {
        projectIds: '',
        list: null,
        listLoading: true,
        total: 0,
        listQuery: {
          current: 1,
          size: 10,
          jobGroup: 0,
          triggerStatus: -1,
          jobDesc: '',
          executorHandler: '',
          userId: 0,
          projectIds: ''
        },
        showCronBox: false,
        dialogPluginVisible: false,
        pluginData: [],
        dialogFormVisible: false,
        dialogStatus: '',
        textMap: {
          update: 'Edit',
          create: 'Create'
        },
        rules: {
          jobGroup: [{
            required: true,
            message: 'jobGroup is required',
            trigger: 'change'
          }],
          executorRouteStrategy: [{
            required: true,
            message: 'executorRouteStrategy is required',
            trigger: 'change'
          }],
          executorBlockStrategy: [{
            required: true,
            message: 'executorBlockStrategy is required',
            trigger: 'change'
          }],
          jobDesc: [{
            required: true,
            message: 'jobDesc is required',
            trigger: 'blur'
          }],
          jobProject: [{
            required: true,
            message: 'jobProject is required',
            trigger: 'blur'
          }],
          jobCron: [{
            required: true,
            message: 'jobCron is required',
            trigger: 'blur'
          }],
          incStartId: [{
            trigger: 'blur',
            validator: validateIncParam
          }],
          replaceParam: [{
            trigger: 'blur',
            validator: validateIncParam
          }],
          primaryKey: [{
            trigger: 'blur',
            validator: validateIncParam
          }],
          incStartTime: [{
            trigger: 'change',
            validator: validateIncParam
          }],
          replaceParamType: [{
            trigger: 'change',
            validator: validateIncParam
          }],
          partitionField: [{
            trigger: 'blur',
            validator: validatePartitionParam
          }],
          datasourceId: [{
            trigger: 'change',
            validator: validateIncParam
          }],
          readerTable: [{
            trigger: 'blur',
            validator: validateIncParam
          }],
          projectId: [{
            required: true,
            message: 'projectId is required',
            trigger: 'change'
          }]
        },
        temp: {
          id: undefined,
          jobGroup: '',
          jobCron: '',
          jobDesc: '',
          executorRouteStrategy: 'RANDOM',
          executorBlockStrategy: 'DISCARD_LATER',
          childJobId: '',
          executorFailRetryCount: '',
          alarmEmail: '',
          executorTimeout: '',
          userId: 0,
          jobConfigId: '',
          executorHandler: 'executorJobHandler',
          glueType: 'BEAN',
          executorParam: '',
          jvmParam: '',
          projectId: '',
          datasourceId: 0,
          readerTable: ''
        },
        resetTemp() {
          this.temp = this.$options.data().temp
        },
        executorList: '',
        jobIdList: '',
        jobProjectList: '',
        dataSourceList: '',
        blockStrategies: [{
          value: 'SERIAL_EXECUTION',
          label: '单机串行'
        }, {
          value: 'DISCARD_LATER',
          label: '丢弃后续调度'
        }, {
          value: 'COVER_EARLY',
          label: '覆盖之前调度'
        }],
        routeStrategies: [{
            value: 'FIRST',
            label: '第一个'
          }, {
            value: 'LAST',
            label: '最后一个'
          }, {
            value: 'ROUND',
            label: '轮询'
          }, {
            value: 'RANDOM',
            label: '随机'
          }, {
            value: 'CONSISTENT_HASH',
            label: '一致性HASH'
          }, {
            value: 'LEAST_FREQUENTLY_USED',
            label: '最不经常使用'
          }, {
            value: 'LEAST_RECENTLY_USED',
            label: '最近最久未使用'
          }, {
            value: 'FAILOVER',
            label: '故障转移'
          }, {
            value: 'BUSYOVER',
            label: '忙碌转移'
          }
          // { value: 'SHARDING_BROADCAST', label: '分片广播' }
        ],
        glueTypes: [{
          value: 'BEAN',
          label: 'DataX任务'
        }],
        triggerNextTimes: '',
        registerNode: []
      }
    },
    created() {
      this.fetchData()
      this.getExecutor()
      this.getJobIdList()
      this.getJobProject()
      this.getDataSourceList()
    },

    methods: {
      handleClose(done) {
        this.$confirm('确认关闭？')
          .then(_ => {
            done()
          })
          .catch(_ => {})
      },
      getExecutor() {
        jobTemp.getExecutorList().then(response => {
          const {
            content
          } = response
          this.executorList = content
        })
      },
      getJobIdList() {
        job.getJobIdList().then(response => {
          const {
            content
          } = response
          this.jobIdList = content
        })
      },
      getJobProject() {
        jobProjectApi.getJobProjectList().then(response => {
          this.jobProjectList = response
        })
      },
      getDataSourceList() {
        datasourceApi.getDataSourceList().then(response => {
          this.dataSourceList = response
        })
      },
      fetchData() {
        this.listLoading = true
        if (this.projectIds) {
          this.listQuery.projectIds = this.projectIds.toString()
        }
        jobTemp.getList(this.listQuery).then(response => {
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
        this.temp.jobGroup = this.executorList[0]['id']
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      createData() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            if (this.temp.childJobId) {
              const childJobs = []
              for (const i in this.temp.childJobId) {
                childJobs.push(this.temp.childJobId[i].id)
              }
              this.temp.childJobId = childJobs.toString()
            }
            if (this.partitionField) this.temp.partitionInfo = this.partitionField + ',' + this.timeOffset + ',' + this.timeFormatType
            jobTemp.createJob(this.temp).then(() => {
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
      handlerUpdate(row) {
        this.resetTemp()
        this.temp = Object.assign({}, row) // copy obj
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        const arrchildSet = []
        const arrJobIdList = []
        if (this.JobIdList) {
          for (const n in this.JobIdList) {
            if (this.JobIdList[n].id !== this.temp.id) {
              arrJobIdList.push(this.JobIdList[n])
            }
          }
          this.JobIdList = arrJobIdList
        }

        if (this.temp.childJobId) {
          const arrString = this.temp.childJobId.split(',')
          for (const i in arrString) {
            for (const n in this.jobIdList) {
              if (this.jobIdList[n].id === parseInt(arrString[i])) {
                arrchildSet.push(this.jobIdList[n])
              }
            }
          }
          this.temp.childJobId = arrchildSet
        }

        if (this.temp.partitionInfo) {
          const partition = this.temp.partitionInfo.split(',')
          this.partitionField = partition[0]
          this.timeOffset = partition[1]
          this.timeFormatType = partition[2]
        }
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      updateData() {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            if (this.temp.childJobId) {
              const childJobs = []
              for (const i in this.temp.childJobId) {
                childJobs.push(this.temp.childJobId[i].id)
              }
              this.temp.childJobId = childJobs.toString()
            }
            if (this.partitionField) this.temp.partitionInfo = this.partitionField + ',' + this.timeOffset + ',' + this.timeFormatType
            jobTemp.updateJob(this.temp).then(() => {
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
      handlerDelete(row) {
        this.$confirm('确定删除吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          jobTemp.removeJob(row.id).then(response => {
            this.fetchData()
            this.$notify({
              title: 'Success',
              message: 'Delete Successfully',
              type: 'success',
              duration: 2000
            })
          })
        })

        // const index = this.list.indexOf(row)
      },
      nextTriggerTime(row) {
        jobTemp.nextTriggerTime(row.jobCron).then(response => {
          const {
            content
          } = response
          this.triggerNextTimes = content.join('<br>')
        })
      },
      loadById(row) {
        executor.loadById(row.jobGroup).then(response => {
          this.registerNode = []
          const {
            content
          } = response
          this.registerNode.push(content)
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "schedulerTemplates"));
});
