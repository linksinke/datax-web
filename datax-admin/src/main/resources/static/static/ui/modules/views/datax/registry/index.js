/* Original readable DataX Web UI source: views/datax/registry/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/registry/index", function(module, exports, require) {

  const datax_registryModule = require("api/datax-registry");
  const wavesModule = require("directive/waves/index"); // waves directive

  const defaultExport = {
    name: 'Registry',
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
          registryKey: undefined
        },
        dialogPluginVisible: false
      }
    },
    created() {
      this.fetchData()
    },
    mounted() {

    },
    methods: {
      fetchData() {
        this.listLoading = true
        this.list = []
        datax_registryModule.getList(this.listQuery).then(response => {
          const {
            records
          } = response
          const {
            total
          } = response
          this.total = total
          this.list = records
          this.listLoading = false
          this.$nextTick(function() {
            for (let i = 0; i < this.list.length; i++) {
              this.initEcharts(this.list[i])
            }
          })
        })
      },
      initEcharts(data) {
        const myChart1 = this.$echarts.init(document.getElementsByClassName(data.id)[0])
        // 绘制图表
        var option1 = {
          title: {
            text: 'cpu使用率',
            subtext: '',
            x: 'center'
          },
          tooltip: {
            formatter: '{a} <br/>{b} : {c}%'
          },
          toolbox: {
            feature: {
              restore: {},
              saveAsImage: {}
            },
            show: false
          },
          series: [{
            name: 'cpu使用率',
            type: 'gauge',
            max: 100,
            radius: '70%', // 半径
            startAngle: 215, // 起始位置
            endAngle: -35, // 终点位置
            detail: {
              formatter: '{value}%'
            },
            data: [{
              value: data.cpuUsage,
              name: ''
            }]
          }]
        }
        myChart1.setOption(option1)

        const myChart2 = this.$echarts.init(document.getElementsByClassName(data.id)[1])
        // 绘制图表
        var option2 = {
          title: {
            text: '内存使用率',
            subtext: '',
            x: 'center'
          },
          tooltip: {
            formatter: '{a} <br/>{b} : {c}%'
          },
          toolbox: {
            feature: {
              restore: {},
              saveAsImage: {}
            },
            show: false
          },
          series: [{
            name: '内存使用率',
            type: 'gauge',
            max: 100,
            radius: '70%', // 半径
            startAngle: 215, // 起始位置
            endAngle: -35, // 终点位置
            detail: {
              formatter: '{value}%'
            },
            data: [{
              value: data.memoryUsage,
              name: ''
            }]
          }]
        }
        myChart2.setOption(option2)
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "resources"));
});
