/* Original readable DataX Web UI source: api/metadata-query; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("api/metadata-query", function(module, exports, require) {
  const requestModule = require("utils/request");

  // 数据库信息api

  // 获取表名
  function getTables(params) {
    return requestModule.default({
      url: '/api/metadata/getTables',
      method: 'get',
      params
    })
  }

  // 获取schema
  function getTableSchema(params) {
    return requestModule.default({
      url: '/api/metadata/getDBSchema',
      method: 'get',
      params
    })
  }

  // 获取字段
  function getColumns(params) {
    return requestModule.default({
      url: '/api/metadata/getColumns',
      method: 'get',
      params
    })
  }

  // 根据sql获取字段
  function getColumnsByQuerySql(params) {
    return requestModule.default({
      url: '/api/metadata/getColumnsByQuerySql',
      method: 'get',
      params
    })
  }

  // 根据datasourceID、tablename创建表【目标端】
  function createTable(params) {
    return requestModule.default({
      url: '/api/metadata/createTable',
      method: 'post',
      params
    })
  }
  // 判断字段是否存在，存在，即更新值，否则添加字段
  function updateColumnsValue(query) {
    return requestModule.default({
      url: '/api/metadata/updateColumnsValue',
      method: 'post',
      data: query
    })
  }

  Object.defineProperty(exports, "getTables", {
    enumerable: true,
    get: function() {
      return getTables;
    }
  });
  Object.defineProperty(exports, "getTableSchema", {
    enumerable: true,
    get: function() {
      return getTableSchema;
    }
  });
  Object.defineProperty(exports, "getColumns", {
    enumerable: true,
    get: function() {
      return getColumns;
    }
  });
  Object.defineProperty(exports, "getColumnsByQuerySql", {
    enumerable: true,
    get: function() {
      return getColumnsByQuerySql;
    }
  });
  Object.defineProperty(exports, "createTable", {
    enumerable: true,
    get: function() {
      return createTable;
    }
  });
  Object.defineProperty(exports, "updateColumnsValue", {
    enumerable: true,
    get: function() {
      return updateColumnsValue;
    }
  });
});
