/* Original readable DataX Web UI source: layout/components/Sidebar/Item; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/Sidebar/Item", function(module, exports, require) {
  const defaultExport = {
    name: 'MenuItem',
    functional: true,
    props: {
      icon: String,
      title: String
    },
    render(createElement, context) {
      const nodes = []
      if (context.props.icon) nodes.push(createElement('svg-icon', {
        props: {
          iconClass: context.props.icon
        }
      }))
      if (context.props.title) nodes.push(createElement('span', {
        slot: 'title'
      }, context.props.title))
      return nodes
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
