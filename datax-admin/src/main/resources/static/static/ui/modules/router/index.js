/* Original readable DataX Web UI source: router/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("router/index", function(module, exports, require) {
  const VueModule = require("vue");
  const RouterModule = require("vue-router");
  VueModule.default.use(RouterModule.default)
  // Defer layout creation until the store has finished initializing.
  const Layout = () => Promise.resolve(DataxModules.require('layout/index').default)
  const constantRoutes = DataxUI.constantRoutes(Layout, DataxModules.require)
  const asyncRoutes = DataxUI.businessRoutes(Layout, DataxModules.require)
  const createRouter = () => new RouterModule.default({
    scrollBehavior: () => ({
      y: 0
    }),
    routes: constantRoutes
  })
  const router = createRouter()

  function resetRouter() {
    router.matcher = createRouter().matcher
  }

  const defaultExport = router

  Object.defineProperty(exports, "constantRoutes", {
    enumerable: true,
    get: function() {
      return constantRoutes;
    }
  });
  Object.defineProperty(exports, "asyncRoutes", {
    enumerable: true,
    get: function() {
      return asyncRoutes;
    }
  });
  Object.defineProperty(exports, "resetRouter", {
    enumerable: true,
    get: function() {
      return resetRouter;
    }
  });
  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
});
