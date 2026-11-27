/* Original readable DataX Web UI source: layout/mixin/ResizeHandler; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/mixin/ResizeHandler", function(module, exports, require) {
  const storeModule = require("store/index");

  const {
    body
  } = document
  const WIDTH = 992 // refer to Bootstrap's responsive design

  const defaultExport = {
    watch: {
      $route(route) {
        if (this.device === 'mobile' && this.sidebar.opened) {
          storeModule.default.dispatch('app/closeSideBar', {
            withoutAnimation: false
          })
        }
      }
    },
    beforeMount() {
      window.addEventListener('resize', this.$_resizeHandler)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.$_resizeHandler)
    },
    mounted() {
      const isMobile = this.$_isMobile()
      if (isMobile) {
        storeModule.default.dispatch('app/toggleDevice', 'mobile')
        storeModule.default.dispatch('app/closeSideBar', {
          withoutAnimation: true
        })
      }
    },
    methods: {
      // use $_ for mixins properties
      // https://vuejs.org/v2/style-guide/index.html#Private-property-names-essential
      $_isMobile() {
        const rect = body.getBoundingClientRect()
        return rect.width - 1 < WIDTH
      },
      $_resizeHandler() {
        if (!document.hidden) {
          const isMobile = this.$_isMobile()
          storeModule.default.dispatch('app/toggleDevice', isMobile ? 'mobile' : 'desktop')

          if (isMobile) {
            storeModule.default.dispatch('app/closeSideBar', {
              withoutAnimation: true
            })
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
