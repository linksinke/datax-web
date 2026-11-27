/* Browser application entry. Start Spring Boot; no frontend build or development server. */
(function () {
  'use strict';
  const require = DataxModules.require;
  const Vue = require('vue').default;
  const ElementUI = require('element-ui').default;
  const Cookies = require('js-cookie').default;
  const store = require('store/index').default;
  const router = require('router/index').default;
  const filters = require('filters/index');

  Vue.use(ElementUI, { size: Cookies.get('size') || 'medium' });
  Vue.prototype.$echarts = require('echarts').default;
  Vue.component('svg-icon', require('components/SvgIcon/index').default);
  Object.keys(filters).forEach(name => Vue.filter(name, filters[name]));
  Vue.config.productionTip = false;
  Vue.config.devtools = false;

  DataxUI.install(Vue, router, store, {
    request: require('utils/request').default,
    navigation: require('datax-navigation'),
    codeEditor: require('datax-config-template').JsonCodeEditor
  });
  require('permission');
  new Vue({ el: '#app', router, store, render: createElement => createElement('div', { attrs: { id: 'app' } }, [createElement('router-view')]) });
})();
