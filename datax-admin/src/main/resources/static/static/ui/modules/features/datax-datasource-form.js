/* Readable browser module. HTML templates live under ui/views/. */
DataxModules.define("datax-datasource-form", function(module, exports, require) {
  "use strict";
  var request = require("utils/request").default;

  function busy(vm) {
    return vm.datasourceSaving || vm.datasourceTesting;
  }

  function validate(vm) {
    return new Promise(function(resolve) {
      vm.$refs.dataForm.validate(function(valid) {
        resolve(!!valid);
      });
    });
  }

  function payload(vm) {
    return Object.assign({}, vm.temp);
  }

  function notify(vm, title, message, type) {
    vm.$notify({
      title: title,
      message: message,
      type: type,
      duration: 3000
    });
  }

  async function save(vm, method) {
    if (busy(vm)) return;
    vm.datasourceSaving = true;
    try {
      if (!await validate(vm)) return;
      var ok = await request({
        url: "/api/jobJdbcDatasource",
        method: method,
        data: payload(vm)
      });
      if (ok !== true) throw new Error("保存失败，请检查配置后重试");
      vm.dialogFormVisible = false;
      notify(vm, "保存成功", method === "post" ? "数据源已添加" : "数据源已更新", "success");
      vm.fetchData();
    } catch (error) {
      notify(vm, "保存失败", error.message || "请检查配置后重试", "error");
    } finally {
      vm.datasourceSaving = false;
    }
  }

  async function testConnection(vm) {
    if (busy(vm)) return;
    vm.datasourceTesting = true;
    vm.connectionResult = null;
    try {
      if (!await validate(vm)) return;
      var ok = await request({
        url: "/api/jobJdbcDatasource/test",
        method: "post",
        data: payload(vm)
      });
      vm.connectionResult = ok === true ? {
          type: "success",
          message: "连接成功，当前配置可以连接数据库。"
        } :
        {
          type: "error",
          message: "连接失败，请检查连接地址和账号信息。"
        };
    } catch (error) {
      vm.connectionResult = {
        type: "error",
        message: error.message || "连接失败，请检查配置后重试。"
      };
    } finally {
      vm.datasourceTesting = false;
    }
  }

  module.exports = {
    save: save,
    testConnection: testConnection
  };

});
