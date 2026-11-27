/* Original readable DataX Web UI source: layout/components/Sidebar/Link; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Sidebar/Link", function(module, exports, require) {

  const validateModule = require("utils/validate");

  const defaultExport = {
    props: {
      to: {
        type: String,
        required: true
      }
    },
    methods: {
      linkProps(url) {
        if (validateModule.isExternal(url)) {
          return {
            is: 'a',
            href: url,
            target: '_blank',
            rel: 'noopener'
          }
        }
        return {
          is: 'router-link',
          to: url
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/layout/components/Sidebar/Link"));
  defaultExport._scopeId = "data-source-ed071362";
});
