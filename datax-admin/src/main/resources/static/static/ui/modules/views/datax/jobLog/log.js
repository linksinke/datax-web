/* Original readable DataX Web UI source: views/datax/jobLog/log; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/jobLog/log", function(module, exports, require) {

  const log = require("api/datax-job-log");
  const defaultExport = {
    data() {
      return {
        logContent: '',
        logLoading: false
      }
    },
    created() {
      this.loadLog()
    },
    methods: {
      loadLog() {
        this.logLoading = true

        log.viewJobLog(this.$route.query.executorAddress, this.$route.query.triggerTime, this.$route.query.id, this.$route.query.fromLineNum).then(response => {
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
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/jobLog/log"));
  defaultExport._scopeId = "data-source-5098ef3f";
});
