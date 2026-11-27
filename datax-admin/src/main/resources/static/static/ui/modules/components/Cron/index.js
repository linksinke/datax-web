/* Original readable DataX Web UI source: components/Cron/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/Cron/index", function(module, exports, require) {

  const SecondAndMinuteModule = require("components/Cron/component/secondAndMinute");
  const hourModule = require("components/Cron/component/hour");
  const dayModule = require("components/Cron/component/day");
  const monthModule = require("components/Cron/component/month");
  const weekModule = require("components/Cron/component/week");
  const yearModule = require("components/Cron/component/year");
  const defaultExport = {
    components: {
      SecondAndMinute: SecondAndMinuteModule.default,
      hour: hourModule.default,
      day: dayModule.default,
      month: monthModule.default,
      week: weekModule.default,
      year: yearModule.default
    },
    props: {
      value: {
        type: String
      }
    },
    data() {
      return {
        //
        activeName: 's',
        sVal: '',
        mVal: '',
        hVal: '',
        dVal: '',
        monthVal: '',
        weekVal: '',
        yearVal: ''
      }
    },
    computed: {
      tableData() {
        return [{
          sVal: this.sVal,
          mVal: this.mVal,
          hVal: this.hVal,
          dVal: this.dVal,
          monthVal: this.monthVal,
          weekVal: this.weekVal,
          yearVal: this.yearVal
        }]
      },
      value_() {
        if (!this.dVal && !this.weekVal) {
          return ''
        }
        if (this.dVal === '?' && this.weekVal === '?') {
          this.$message.error('日期与星期不可以同时为“不指定”')
        }
        if (this.dVal !== '?' && this.weekVal !== '?') {
          this.$message.error('日期与星期必须有一个为“不指定”')
        }
        const v = `${this.sVal} ${this.mVal} ${this.hVal} ${this.dVal} ${this.monthVal} ${this.weekVal} ${this.yearVal}`
        if (v !== this.value) {
          this.$emit('input', v)
        }
        return v
      }
    },
    watch: {
      value(a, b) {
        this.updateVal()
      }
    },
    created() {
      this.updateVal()
    },
    methods: {
      updateVal() {
        if (!this.value) {
          return
        }
        const arrays = this.value.split(' ')
        this.sVal = arrays[0]
        this.mVal = arrays[1]
        this.hVal = arrays[2]
        this.dVal = arrays[3]
        this.monthVal = arrays[4]
        this.weekVal = arrays[5]
        this.yearVal = arrays[6]
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/Cron/index"));
  defaultExport._scopeId = "data-source-0ba0cbe4";
});
