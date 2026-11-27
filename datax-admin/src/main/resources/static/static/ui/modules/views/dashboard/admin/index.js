/* Original readable DataX Web UI source: views/dashboard/admin/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/dashboard/admin/index", function(module, exports, require) {
  const LineChartModule = require("views/dashboard/admin/components/LineChart");
  const defaultExport = {
    name: 'DashboardAdmin',
    components: {
      LineChart: LineChartModule.default
    },
    data() {
      return {
        lineChartData: {
          successData: [],
          failData: [],
          dayList: []
        }
      }
    },
    created() {
      this.fetchData()
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "overview"));
});
