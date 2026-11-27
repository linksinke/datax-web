/* Original readable DataX Web UI source: components/Pagination/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/Pagination/index", function(module, exports, require) {

  const scroll_toModule = require("utils/scroll-to");

  const defaultExport = {
    name: 'Pagination',
    props: {
      total: {
        required: true,
        type: Number
      },
      page: {
        type: Number,
        default: 1
      },
      limit: {
        type: Number,
        default: 20
      },
      pageSizes: {
        type: Array,
        default () {
          return [10, 20, 30, 50]
        }
      },
      layout: {
        type: String,
        default: 'total, sizes, prev, pager, next, jumper'
      },
      background: {
        type: Boolean,
        default: true
      },
      autoScroll: {
        type: Boolean,
        default: true
      },
      hidden: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      currentPage: {
        get() {
          return this.page
        },
        set(val) {
          this.$emit('update:page', val)
        }
      },
      pageSize: {
        get() {
          return this.limit
        },
        set(val) {
          this.$emit('update:limit', val)
        }
      }
    },
    methods: {
      handleSizeChange(val) {
        this.$emit('pagination', {
          page: this.currentPage,
          limit: val
        })
        if (this.autoScroll) {
          scroll_toModule.scrollTo(0, 800)
        }
      },
      handleCurrentChange(val) {
        this.$emit('pagination', {
          page: val,
          limit: this.pageSize
        })
        if (this.autoScroll) {
          scroll_toModule.scrollTo(0, 800)
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
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/Pagination/index"));
  defaultExport._scopeId = "data-source-5d78516a";
});
