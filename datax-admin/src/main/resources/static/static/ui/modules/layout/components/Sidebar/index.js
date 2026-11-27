/* Original readable DataX Web UI source: layout/components/Sidebar/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Sidebar/index", function(module, exports, require) {

  const vuexModule = require("vuex");
  const LogoModule = require("layout/components/Sidebar/Logo");
  const SidebarItemModule = require("layout/components/Sidebar/SidebarItem");
  const variablesModule = require("styles/variables");

  const defaultExport = {
    components: {
      SidebarItem: SidebarItemModule.default,
      Logo: LogoModule.default
    },
    computed: {
      ...vuexModule.mapGetters([
        'permission_routes',
        'sidebar'
      ]),
      activeMenu() {
        const route = this.$route
        const {
          meta,
          path
        } = route
        // if set path, the sidebar will highlight the path you set
        if (meta.activeMenu) {
          return meta.activeMenu
        }
        return path
      },
      showLogo() {
        return this.$store.state.settings.sidebarLogo
      },
      variables() {
        return variablesModule.default
      },
      isCollapse() {
        return !this.sidebar.opened
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  defaultExport.computed.menuRoutes = function() {
    return require('datax-navigation').buildMenu(this.permission_routes);
  };
  Object.assign(defaultExport, DataxUI.part(defaultExport, "sidebar"));
});
