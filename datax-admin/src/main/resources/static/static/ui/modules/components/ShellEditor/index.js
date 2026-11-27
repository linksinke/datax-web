/* Original readable DataX Web UI source: components/ShellEditor/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("components/ShellEditor/index", function(module, exports, require) {

  const CodeMirrorModule = require("codemirror");

  undefined

  const defaultExport = {
    name: 'ShellEditor',
    props: ['value'],
    data() {
      return {
        shellEditor: false
      }
    },
    watch: {
      value(value) {
        const editorValue = this.shellEditor.getValue()
        if (value !== editorValue) {
          this.shellEditor.setValue(this.value)
        }
      }
    },
    mounted() {
      this.shellEditor = CodeMirrorModule.default.fromTextArea(this.$refs.textarea, {
        lineNumbers: true,
        mode: 'text/x-sh',
        gutters: ['CodeMirror-lint-markers'],
        theme: 'default',
        lint: false
      })

      this.shellEditor.setValue(this.value ? this.value : '')
      this.shellEditor.on('change', cm => {
        this.$emit('changed', cm.getValue())
        this.$emit('input', cm.getValue())
      })
    },
    methods: {
      getValue() {
        return this.shellEditor.getValue()
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.apply(defaultExport, "source/components/ShellEditor/index"));
  defaultExport._scopeId = "data-source-a6504f7d";
});
