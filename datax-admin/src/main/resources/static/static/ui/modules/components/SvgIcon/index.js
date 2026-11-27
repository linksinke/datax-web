/* Original readable DataX Web UI source: components/SvgIcon/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/SvgIcon/index", function(module, exports, require) {

  // doc: https://panjiachen.github.io/vue-element-admin-site/feature/component/svg-icon.html#usage
  const validateModule = require("utils/validate");

  const defaultExport = {
    name: 'SvgIcon',
    props: {
      iconClass: {
        type: String,
        required: true
      },
      className: {
        type: String,
        default: ''
      }
    },
    computed: {
      isExternal() {
        return validateModule.isExternal(this.iconClass)
      },
      iconName() {
        return (window.DataxManifest && window.DataxManifest.icons || "/static/ui/icons.svg") + "#icon-" + this.iconClass
      },
      svgClass() {
        if (this.className) {
          return 'svg-icon ' + this.className
        } else {
          return 'svg-icon'
        }
      },
      styleExternalIcon() {
        return {
          mask: `url(${this.iconClass}) no-repeat 50% 50%`,
          '-webkit-mask': `url(${this.iconClass}) no-repeat 50% 50%`
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/SvgIcon/index"));
  defaultExport._scopeId = "data-source-86be2817";
});
