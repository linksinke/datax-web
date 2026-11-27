/* 统一管理库请求：共享登录令牌，并让页面负责显示可恢复的错误状态。 */
DataxModules.define('utils/request', function (module, exports, require) {
  const axios = require('axios').default;
  const Element = require('element-ui');
  const store = require('store/index');
  const auth = require('utils/auth');
  const client = axios.create({ baseURL: '/', timeout: 20000 });
  client.interceptors.request.use(config => {
    if (store.default.getters.token) config.headers.Authorization = auth.getToken();
    return config;
  });
  client.interceptors.response.use(response => {
    const result = response.data;
    if (result && [0, 200, 20000].includes(result.code)) return result.code === 0 ? result.data : result;
    const message = result && result.msg || '操作未完成，请重试';
    if (!response.config.silent) Element.Message.error(message);
    if (result && [50008, 50012, 50014].includes(result.code)) {
      Element.MessageBox.confirm('登录状态已失效，请重新登录。', '登录提示', { confirmButtonText: '重新登录', cancelButtonText: '稍后处理', type: 'warning' })
        .then(() => store.default.dispatch('user/resetToken').then(() => location.reload())).catch(() => {});
    }
    return Promise.reject(new Error(message));
  }, error => {
    const status = error.response && error.response.status;
    const message = status === 403 ? '当前账号没有操作权限' : status === 401 ? '登录已失效，请重新登录' : error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络连接失败，请检查服务后重试';
    if (!(error.config && error.config.silent)) Element.Message.error(message);
    return Promise.reject(new Error(message));
  });
  exports.default = client;
});
