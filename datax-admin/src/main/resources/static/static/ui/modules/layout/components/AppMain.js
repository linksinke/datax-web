/* Original readable DataX Web UI source: layout/components/AppMain; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/AppMain", function(module, exports, require) {

  const defaultExport = {
    name: 'AppMain',
    computed: {
      cachedViews() {
        return this.$store.state.tagsView.cachedViews
      },
      key() {
        return this.$route.path
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  defaultExport.components = {
    WorkspaceHeading: DataxUI.part(require('datax-navigation').WorkspaceHeading, 'heading')
  };
  Object.assign(defaultExport, DataxUI.part(defaultExport, "app-main"));
});
