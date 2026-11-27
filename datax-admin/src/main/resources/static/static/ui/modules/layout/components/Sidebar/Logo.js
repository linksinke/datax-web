/* Original readable DataX Web UI source: layout/components/Sidebar/Logo; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Sidebar/Logo", function(module, exports, require) {

  const defaultExport = {
    name: 'SidebarLogo',
    props: {
      collapse: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        title: 'DataX Web',
        logo: '/static/img/datax-mark.svg'
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/layout/components/Sidebar/Logo"));
  defaultExport._scopeId = "data-source-b2b40dd1";
});
