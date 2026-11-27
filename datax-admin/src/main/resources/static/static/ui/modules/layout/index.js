/* Original readable DataX Web UI source: layout/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/index", function(module, exports, require) {
  const AppMainModule = require("layout/components/AppMain");
  const NavbarModule = require("layout/components/Navbar");
  const SidebarModule = require("layout/components/Sidebar/index");
  const TagsViewModule = require("layout/components/TagsView/index");
  const ResizeMixinModule = require("layout/mixin/ResizeHandler");
  const vuexModule = require("vuex");
  const defaultExport = {
    name: 'Layout',
    components: {
      AppMain: AppMainModule.default,
      Navbar: NavbarModule.default,
      Sidebar: SidebarModule.default,
      TagsView: TagsViewModule.default
    },
    mixins: [ResizeMixinModule.default],
    computed: {
      ...vuexModule.mapState({
        sidebar: state => state.app.sidebar,
        device: state => state.app.device,
        needTagsView: state => state.settings.tagsView
      }),
      classObj() {
        return {
          hideSidebar: !this.sidebar.opened,
          openSidebar: this.sidebar.opened,
          withoutAnimation: this.sidebar.withoutAnimation,
          mobile: this.device === 'mobile'
        }
      }
    },
    methods: {
      handleClickOutside() {
        this.$store.dispatch('app/closeSideBar', {
          withoutAnimation: false
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
  Object.assign(defaultExport, DataxUI.part(defaultExport, "layout"));
});
