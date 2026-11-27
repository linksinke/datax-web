/* Original readable DataX Web UI source: views/datax/json-build-batch/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/index", function(module, exports, require) {

  const jobTemplate = require("api/datax-job-template");
  const job = require("api/datax-job-info");
  const PaginationModule = require("components/Pagination/index");
  const ReaderModule = require("views/datax/json-build-batch/reader");
  const WriterModule = require("views/datax/json-build-batch/writer");
  const clipModule = require("utils/clipboard");
  const MapperModule = require("views/datax/json-build-batch/mapper");

  const defaultExport = {
    name: 'JsonBuild',
    components: {
      Reader: ReaderModule.default,
      Writer: WriterModule.default,
      Pagination: PaginationModule.default,
      Mapper: MapperModule.default
    },
    data() {
      return {
        configJson: '',
        active: 1,
        jobTemplate: '',
        jobTemplateSelectDrawer: false,
        list: null,
        currentRow: null,
        listLoading: true,
        total: 0,
        listQuery: {
          current: 1,
          size: 10,
          jobGroup: 0,
          triggerStatus: -1,
          jobDesc: '',
          executorHandler: '',
          userId: 0
        },
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
        triggerNextTimes: '',
        registerNode: [],
        jobJson: '',
        temp: {
          id: undefined,
          jobGroup: '',
          jobCron: '',
          jobDesc: '',
          executorRouteStrategy: '',
          executorBlockStrategy: '',
          childJobId: '',
          executorFailRetryCount: '',
          alarmEmail: '',
          executorTimeout: '',
          userId: 0,
          jobConfigId: '',
          executorHandler: 'executorJobHandler',
          glueType: 'BEAN',
          jobJson: '',
          executorParam: '',
          replaceParam: '',
          jvmParam: '',
          incStartTime: '',
          templateId: 0
        }
      }
    },
    created() {
      // this.getJdbcDs()
    },
    methods: {
      next() {
        const fromTableList = this.$refs.reader.getData().tables
        const toTableList = this.$refs.writer.getData().tables
        // const fromTableName = this.$refs.reader.getData().tableName
        // 第一步 reader 判断是否已选字段
        if (this.active === 1) {
          // 实现第一步骤读取的表和字段直接带到第二步骤
          // this.$refs.writer.sendTableNameAndColumns(fromTableName, fromColumnList)
          // 取子组件的数据
          // console.info(this.$refs.reader.getData())
          this.active++
        } else {
          // 将第一步和第二步得到的字段名字发送到第三步
          if (this.active === 2) {
            this.$refs.mapper.sendTables(fromTableList, toTableList)
          }
          if (this.active !== 4) {
            this.active++
          }
        }
      },
      last() {
        if (this.active > 1) {
          this.active--
        }
      },
      // Create job
      createJob() {
        const readerData = this.$refs.reader.getData()
        const writeData = this.$refs.writer.getData()
        const readerTables = this.$refs.mapper.getLTables()
        const writerTables = this.$refs.mapper.getRTables()
        const rdbmsReader = {
          readerSplitPk: readerData.splitPk
        }
        const rdbmsWriter = {}
        const obj = {
          readerDatasourceId: readerData.datasourceId,
          readerTables: readerTables,
          writerDatasourceId: writeData.datasourceId,
          writerTables: writerTables,
          rdbmsReader: rdbmsReader,
          rdbmsWriter: rdbmsWriter,
          templateId: this.temp.templateId
        }
        // 调api
        job.batchAddJob(obj).then(response => {
          this.$notify({
            title: 'Success',
            message: 'Created Successfully',
            type: 'success',
            duration: 2000
          })
          // 切回第一步
          this.active = 1
        })
      },
      handleCopy(text, event) {
        clipModule.default(this.configJson, event)
        this.$message({
          message: 'copy success',
          type: 'success'
        })
      },
      handleJobTemplateSelectDrawer() {
        this.jobTemplateSelectDrawer = !this.jobTemplateSelectDrawer
        if (this.jobTemplateSelectDrawer) {
          this.fetchData()
          this.getExecutor()
        }
      },
      getReaderData() {
        return this.$refs.reader.getData()
      },
      getExecutor() {
        jobTemplate.getExecutorList().then(response => {
          const {
            content
          } = response
          this.executorList = content
        })
      },
      fetchData() {
        this.listLoading = true
        jobTemplate.getList(this.listQuery).then(response => {
          const {
            content
          } = response
          this.total = content.recordsTotal
          this.list = content.data
          this.listLoading = false
        })
      },
      handleCurrentChange(val) {
        this.temp = Object.assign({}, val)
        this.temp.id = undefined
        this.temp.jobDesc = this.getReaderData().tableName
        this.$refs.jobTemplateSelectDrawer.closeDrawer()
        this.jobTemplate = val.id + '(' + val.jobDesc + ')'
        this.temp.templateId = val.id
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "buildBatch"));
});
