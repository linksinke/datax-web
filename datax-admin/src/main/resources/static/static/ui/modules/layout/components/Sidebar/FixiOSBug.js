/* Original readable DataX Web UI source: layout/components/Sidebar/FixiOSBug; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Sidebar/FixiOSBug", function(module, exports, require) {
  const defaultExport = {
    computed: {
      device() {
        return this.$store.state.app.device
      }
    },
    mounted() {
      // In order to fix the click on menu on the ios device will trigger the mouseleave bug
      // https://github.com/PanJiaChen/vue-element-admin/issues/1135
      this.fixBugIniOS()
    },
    methods: {
      fixBugIniOS() {
        const $subMenu = this.$refs.subMenu
        if ($subMenu) {
          const handleMouseleave = $subMenu.handleMouseleave
          $subMenu.handleMouseleave = (e) => {
            if (this.device === 'mobile') {
              return
            }
            handleMouseleave(e)
          }
        }
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
