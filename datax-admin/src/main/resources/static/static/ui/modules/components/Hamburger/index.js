/* Original readable DataX Web UI source: components/Hamburger/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/Hamburger/index", function(module, exports, require) {

  const defaultExport = {
    name: 'Hamburger',
    props: {
      isActive: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      toggleClick() {
        this.$emit('toggleClick')
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/Hamburger/index"));
  defaultExport._scopeId = "data-source-bf31b547";
});
