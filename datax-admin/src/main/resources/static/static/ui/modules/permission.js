/* Original readable DataX Web UI source: permission; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("permission", function(module, exports, require) {
  const routerModule = require("router/index");
  const storeModule = require("store/index");
  const element_uiModule = require("element-ui");
  const NProgressModule = require("nprogress"); // progress bar
  // progress bar style
  const authModule = require("utils/auth"); // get token from cookie
  const getPageTitleModule = require("utils/get-page-title");

  NProgressModule.default.configure({
    showSpinner: false
  }) // NProgress Configuration

  const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

  routerModule.default.beforeEach(async (to, from, next) => {
    // start progress bar
    NProgressModule.default.start()

    // set page title
    document.title = getPageTitleModule.default(to.meta.title)

    // determine whether the user has logged in
    const hasToken = authModule.getToken()

    if (hasToken) {
      if (to.path === '/login') {
        // if is logged in, redirect to the home page
        next({
          path: '/'
        })
        NProgressModule.default.done()
      } else {
        // determine whether the user has obtained his permission roles through getInfo
        const hasRoles = storeModule.default.getters.roles && storeModule.default.getters.roles.length > 0
        if (hasRoles) {
          next()
        } else {
          try {
            // get user info
            // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
            const {
              roles
            } = await storeModule.default.dispatch('user/getInfo')
            // generate accessible routes map based on roles
            const accessRoutes = await storeModule.default.dispatch('permission/generateRoutes', roles)

            // dynamically add accessible routes
            routerModule.default.addRoutes(accessRoutes)

            // hack method to ensure that addRoutes is complete
            // set the replace: true, so the navigation will not leave a history record
            next({
              ...to,
              replace: true
            })
          } catch (error) {
            // remove token and go to login page to re-login
            await storeModule.default.dispatch('user/resetToken')
            element_uiModule.Message.error(error || 'Has Error')
            next(`/login?redirect=${to.path}`)
            NProgressModule.default.done()
          }
        }
      }
    } else {
      /* has no token*/

      if (whiteList.indexOf(to.path) !== -1) {
        // in the free login whitelist, go directly
        next()
      } else {
        // other pages that do not have permission to access are redirected to the login page.
        next(`/login?redirect=${to.path}`)
        NProgressModule.default.done()
      }
    }
  })

  routerModule.default.afterEach(() => {
    // finish progress bar
    NProgressModule.default.done()
  })

});
