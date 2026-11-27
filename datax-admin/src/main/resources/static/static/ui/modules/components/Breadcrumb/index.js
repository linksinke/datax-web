/* Original readable DataX Web UI source: components/Breadcrumb/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/Breadcrumb/index", function(module, exports, require) {

  const pathToRegexpModule = require("path-to-regexp");

  const defaultExport = {
    data() {
      return {
        levelList: null
      }
    },
    watch: {
      $route(route) {
        // if you go to the redirect page, do not update the breadcrumbs
        if (route.path.startsWith('/redirect/')) {
          return
        }
        this.getBreadcrumb()
      }
    },
    created() {
      this.getBreadcrumb()
    },
    methods: {
      getBreadcrumb() {
        // only show routes with meta.title
        let matched = this.$route.matched.filter(item => item.meta && item.meta.title)
        const first = matched[0]

        if (!this.isDashboard(first)) {
          matched = [{
            path: '/dashboard',
            meta: {
              title: 'Dashboard'
            }
          }].concat(matched)
        }

        this.levelList = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false)
      },
      isDashboard(route) {
        const name = route && route.name
        if (!name) {
          return false
        }
        return name.trim().toLocaleLowerCase() === 'Dashboard'.toLocaleLowerCase()
      },
      pathCompile(path) {
        // To solve this problem https://github.com/PanJiaChen/vue-element-admin/issues/561
        const {
          params
        } = this.$route
        var toPath = pathToRegexpModule.default.compile(path)
        return toPath(params)
      },
      handleLink(item) {
        const {
          redirect,
          path
        } = item
        if (redirect) {
          this.$router.push(redirect)
          return
        }
        this.$router.push(this.pathCompile(path))
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  defaultExport.methods.getBreadcrumb = function() {
    this.levelList = require('datax-navigation').breadcrumbs(this.$route);
  };
  Object.assign(defaultExport, DataxUI.part(defaultExport, "breadcrumb"));
});
