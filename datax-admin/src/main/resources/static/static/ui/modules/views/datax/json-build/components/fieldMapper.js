/* Original readable DataX Web UI source: views/datax/json-build/components/fieldMapper; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("views/datax/json-build/components/fieldMapper", function(module, exports, require) {

  const defaultExport = {
    name: 'FieldMapper',
    data() {
      return {
        mapperJson: {},
        fromColumnsList: [],
        toColumnsList: [],
        readerForm: {
          lcolumns: [],
          rcolumns: [],
          lcheckAll: false,
          rcheckAll: false,
          isIndeterminate: true
        }
      }
    },
    mounted() {},
    methods: {
      uiMoveSelected(side, index, offset) {
        const key = side + 'columns', values = this.readerForm[key].slice(), target = index + offset;
        if (target < 0 || target >= values.length) return;
        [values[index], values[target]] = [values[target], values[index]];
        this.readerForm[key] = values;
      },
      lHandleCheckAllChange(val) {
        this.readerForm.lcolumns = val ? this.fromColumnsList : []
        this.readerForm.isIndeterminate = false
      },
      rHandleCheckAllChange(val) {
        this.readerForm.rcolumns = val ? this.toColumnsList : []
        this.readerForm.isIndeterminate = false
      },
      lHandleCheckedChange(value) {
        const checkedCount = value.length
        this.readerForm.lcheckAll = checkedCount === this.fromColumnsList.length
        this.readerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.fromColumnsList.length
      },
      rHandleCheckedChange(value) {
        const checkedCount = value.length
        this.readerForm.rcheckAll = checkedCount === this.toColumnsList.length
        this.readerForm.isIndeterminate = checkedCount > 0 && checkedCount < this.toColumnsList.length
      },
      getLColumns() {
        return this.readerForm.lcolumns
      },
      getRColumns() {
        return this.readerForm.rcolumns
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/views/datax/json-build/components/fieldMapper"));
  defaultExport._scopeId = "data-source-6f40cbaa";
});
