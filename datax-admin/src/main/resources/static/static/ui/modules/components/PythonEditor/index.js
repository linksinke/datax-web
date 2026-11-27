/* Original readable DataX Web UI source: components/PythonEditor/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/PythonEditor/index", function(module, exports, require) {

  const CodeMirrorModule = require("codemirror");

  undefined

  const defaultExport = {
    name: 'PythonEditor',
    props: ['value'],
    data() {
      return {
        pythonEditor: false
      }
    },
    watch: {
      value(value) {
        const editorValue = this.pythonEditor.getValue()
        if (value !== editorValue) {
          this.pythonEditor.setValue(this.value)
        }
      }
    },
    mounted() {
      this.pythonEditor = CodeMirrorModule.default.fromTextArea(this.$refs.textarea, {
        lineNumbers: true,
        mode: 'text/x-python',
        gutters: ['CodeMirror-lint-markers'],
        theme: 'default',
        lint: false
      })

      this.pythonEditor.setValue(this.value ? this.value : '')
      this.pythonEditor.on('change', cm => {
        this.$emit('changed', cm.getValue())
        this.$emit('input', cm.getValue())
      })
    },
    methods: {
      getValue() {
        return this.pythonEditor.getValue()
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/PythonEditor/index"));
  defaultExport._scopeId = "data-source-39495f39";
});
