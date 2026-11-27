/* Original readable DataX Web UI source: views/dashboard/admin/components/LineChart; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/dashboard/admin/components/LineChart", function(module, exports, require) {

  const echartsModule = require("echarts");
  undefined // echarts theme
  const resizeModule = require("views/dashboard/admin/components/mixins/resize");

  const defaultExport = {
    mixins: [resizeModule.default],
    props: {
      className: {
        type: String,
        default: 'chart'
      },
      width: {
        type: String,
        default: '100%'
      },
      height: {
        type: String,
        default: '350px'
      },
      autoResize: {
        type: Boolean,
        default: true
      },
      chartData: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        chart: null
      }
    },
    watch: {
      chartData: {
        deep: true,
        handler(val) {
          this.setOptions(val)
        }
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.initChart()
      })
    },
    beforeDestroy() {
      if (!this.chart) {
        return
      }
      this.chart.dispose()
      this.chart = null
    },
    methods: {
      initChart() {
        this.chart = echartsModule.default.init(this.$el)
        this.setOptions(this.chartData)
      },
      setOptions({
        failData,
        successData,
        dayList
      } = {}) {
        this.chart.setOption({
          animation: false,
          xAxis: {
            data: dayList,
            boundaryGap: false,
            axisTick: {
              show: false
            }
          },
          grid: {
            left: 10,
            right: 10,
            bottom: 20,
            top: 30,
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross'
            },
            padding: [5, 10]
          },
          yAxis: {
            axisTick: {
              show: false
            }
          },
          legend: {
            data: ['失败', '成功']
          },
          series: [{
            name: '失败',
            itemStyle: {
              normal: {
                color: '#c84646',
                lineStyle: {
                  color: '#c84646',
                  width: 2
                }
              }
            },
            smooth: true,
            type: 'line',
            data: failData,
            animationDuration: 2800,
            animationEasing: 'cubicInOut'
          }, {
            name: '成功',
            smooth: true,
            type: 'line',
            itemStyle: {
              normal: {
                color: '#20845b',
                lineStyle: {
                  color: '#20845b',
                  width: 2
                },
                areaStyle: {
                  color: '#f3f8ff'
                }
              }
            },
            data: successData,
            animationDuration: 2800,
            animationEasing: 'quadraticOut'
          }]
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/dashboard/admin/components/LineChart"));
  defaultExport._scopeId = "data-source-b3a9e747";
});
