/* Original readable DataX Web UI source: layout/components/Sidebar/SidebarItem; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Sidebar/SidebarItem", function(module, exports, require) {

  const pathModule = require("path");
  const validateModule = require("utils/validate");
  const ItemModule = require("layout/components/Sidebar/Item");
  const AppLinkModule = require("layout/components/Sidebar/Link");
  const FixiOSBugModule = require("layout/components/Sidebar/FixiOSBug");

  const defaultExport = {
    name: 'SidebarItem',
    components: {
      Item: ItemModule.default,
      AppLink: AppLinkModule.default
    },
    mixins: [FixiOSBugModule.default],
    props: {
      // route object
      item: {
        type: Object,
        required: true
      },
      isNest: {
        type: Boolean,
        default: false
      },
      basePath: {
        type: String,
        default: ''
      }
    },
    data() {
      // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
      // TODO: refactor with render function
      this.onlyOneChild = null
      return {}
    },
    methods: {
      hasOneShowingChild(children = [], parent) {
        const showingChildren = children.filter(item => {
          if (item.hidden) {
            return false
          } else {
            // Temp set(will be used if only has one showing child)
            this.onlyOneChild = item
            return true
          }
        })

        // When there is only one child router, the child router is displayed by default
        if (showingChildren.length === 1) {
          return true
        }

        // Show parent if there are no child router to display
        if (showingChildren.length === 0) {
          this.onlyOneChild = {
            ...parent,
            path: '',
            noShowingChildren: true
          }
          return true
        }

        return false
      },
      resolvePath(routePath) {
        if (validateModule.isExternal(routePath)) {
          return routePath
        }
        if (validateModule.isExternal(this.basePath)) {
          return this.basePath
        }
        return pathModule.default.resolve(this.basePath, routePath)
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/layout/components/Sidebar/SidebarItem"));
  defaultExport._scopeId = "data-source-7bcd7e52";
});
