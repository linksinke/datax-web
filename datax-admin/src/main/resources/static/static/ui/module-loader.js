/* Synchronous browser module registry. All module files are loaded before application.js runs. */
(function (global) {
  'use strict';
  const definitions = Object.create(null);
  const instances = Object.create(null);

  function define(name, factory) {
    if (definitions[name]) throw new Error('模块重复注册：' + name);
    definitions[name] = factory;
  }

  function require(name) {
    if (instances[name]) return instances[name].exports;
    if (!definitions[name]) throw new Error('找不到页面模块：' + name);
    const instance = { exports: {} };
    instances[name] = instance; // Register first so cyclic imports share the same exports object.
    try {
      definitions[name](instance, instance.exports, require);
      return instance.exports;
    } catch (error) {
      delete instances[name];
      throw error;
    }
  }

  global.DataxModules = { define, require, names: function () { return Object.keys(definitions); } };
})(window);
