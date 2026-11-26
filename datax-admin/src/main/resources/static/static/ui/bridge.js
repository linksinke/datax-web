/* Compatibility bridge to the shipped Vue/Element runtime. Editable pages live in views/. */
(window.webpackJsonp = window.webpackJsonp || []).push([["datax-source-ui"], {
    "datax-source-ui": function (module, exports, require) {
        module.exports = {
            page: window.DataxUI.page,
            constantRoutes: window.DataxUI.constantRoutes,
            businessRoutes: window.DataxUI.businessRoutes,
            part: window.DataxUI.part,
            install: function (Vue, router, store) {
                window.DataxUI.install(Vue, router, store, {
                    request: require("b775").a,
                    navigation: require("datax-navigation"),
                    codeEditor: require("datax-config-template").JsonCodeEditor
                });
            }
        };
    }
}]);
