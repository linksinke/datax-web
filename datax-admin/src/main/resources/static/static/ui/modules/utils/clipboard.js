/* Original readable DataX Web UI source: utils/clipboard; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("utils/clipboard", function(module, exports, require) {
  const VueModule = require("vue");
  const ClipboardModule = require("clipboard");

  function clipboardSuccess() {
    VueModule.default.prototype.$message({
      message: 'Copy successfully',
      type: 'success',
      duration: 1500
    })
  }

  function clipboardError() {
    VueModule.default.prototype.$message({
      message: 'Copy failed',
      type: 'error'
    })
  }

  const defaultExport = function handleClipboard(text, event) {
    const clipboard = new ClipboardModule.default(event.target, {
      text: () => text
    })
    clipboard.on('success', () => {
      clipboardSuccess()
      clipboard.off('error')
      clipboard.off('success')
      clipboard.destroy()
    })
    clipboard.on('error', () => {
      clipboardError()
      clipboard.off('error')
      clipboard.off('success')
      clipboard.destroy()
    })
    clipboard.onClick(event)
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
