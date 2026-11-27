/* Original readable DataX Web UI source: components/PowershellEditor/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/PowershellEditor/index", function(module, exports, require) {

  const CodeMirrorModule = require("codemirror");

  undefined

  const defaultExport = {
    name: 'PowershellEditor',
    props: ['value'],
    data() {
      return {
        powershellEditor: false
      }
    },
    watch: {
      value(value) {
        const editorValue = this.powershellEditor.getValue()
        if (value !== editorValue) {
          this.powershellEditor.setValue(this.value)
        }
      }
    },
    mounted() {
      this.powershellEditor = CodeMirrorModule.default.fromTextArea(this.$refs.textarea, {
        lineNumbers: true,
        mode: 'powershell',
        gutters: ['CodeMirror-lint-markers'],
        theme: 'default',
        lint: false
      })

      this.powershellEditor.setValue(this.value ? this.value : '')
      this.powershellEditor.on('change', cm => {
        this.$emit('changed', cm.getValue())
        this.$emit('input', cm.getValue())
      })
    },
    methods: {
      getValue() {
        return this.powershellEditor.getValue()
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/PowershellEditor/index"));
  defaultExport._scopeId = "data-source-14e97238";
});
