/* Original readable DataX Web UI source: views/datax/json-build-batch/components/tableMapper; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build-batch/components/tableMapper", function(module, exports, require) {

  const defaultExport = {
    name: 'TableMapper',
    data() {
      return {
        mapperJson: {},
        fromTablesList: [],
        toTablesList: [],
        readerForm: {
          ltables: [],
          rtables: [],
          lcheckAll: false,
          rcheckAll: false,
          isIndeterminate: true
        }
      }
    },
    mounted() {},
    methods: {
      uiMoveSelected(side, index, offset) {
        const key = side + 'tables', values = this.readerForm[key].slice(), target = index + offset;
        if (target < 0 || target >= values.length) return;
        [values[index], values[target]] = [values[target], values[index]];
        this.readerForm[key] = values;
      },
      lHandleCheckAllChange(val) {
        this.readerForm.ltables = val ? this.fromTablesList : []
        this.readerForm.isIndeterminate = false
      },
      rHandleCheckAllChange(val) {
        this.readerForm.rtables = val ? this.toTablesList : []
        this.readerForm.isIndeterminate = false
      },
      lHandleCheckedChange(value) {
        const checkedCount = value.length
        this.readerForm.lcheckAll = checkedCount === this.fromTablesList.length
        this.readerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.fromTablesList.length
      },
      rHandleCheckedChange(value) {
        const checkedCount = value.length
        this.readerForm.rcheckAll = checkedCount === this.toTablesList.length
        this.readerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.toTablesList.length
      },
      getLTables() {
        return this.readerForm.ltables
      },
      getRTables() {
        return this.readerForm.rtables
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build-batch/components/tableMapper"));
  defaultExport._scopeId = "data-source-78d8b8c6";
});
