/* Original readable DataX Web UI source: layout/components/Navbar; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Navbar", function(module, exports, require) {

  const vuexModule = require("vuex");
  const BreadcrumbModule = require("components/Breadcrumb/index");
  const HamburgerModule = require("components/Hamburger/index");

  const defaultExport = {
    components: {
      Breadcrumb: BreadcrumbModule.default,
      Hamburger: HamburgerModule.default
    },
    computed: {
      ...vuexModule.mapGetters([
        'sidebar',
        'avatar',
        'device'
      ])
    },
    methods: {
      toggleSideBar() {
        this.$store.dispatch('app/toggleSideBar')
      },
      async logout() {
        await this.$store.dispatch('user/logout')
        this.$router.push(`/login?redirect=${this.$route.fullPath}`)
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.part(defaultExport, "navbar"));
});
