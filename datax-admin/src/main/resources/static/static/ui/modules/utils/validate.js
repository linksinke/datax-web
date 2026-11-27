/* Original readable DataX Web UI source: utils/validate; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("utils/validate", function(module, exports, require) {
  /**
   * Created by PanJiaChen on 16/11/18.
   */

  /**
   * @param {string} path
   * @returns {Boolean}
   */
  function isExternal(path) {
    return /^(https?:|mailto:|tel:)/.test(path)
  }

  /**
   * @param {string} str
   * @returns {Boolean}
   */
  function validUsername(str) {
    const valid_map = ['jingwk', 'editor']
    return valid_map.indexOf(str.trim()) >= 0
  }

  /**
   * @param {string} url
   * @returns {Boolean}
   */
  function validURL(url) {
    const reg = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/
    return reg.test(url)
  }

  /**
   * @param {string} str
   * @returns {Boolean}
   */
  function validLowerCase(str) {
    const reg = /^[a-z]+$/
    return reg.test(str)
  }

  /**
   * @param {string} str
   * @returns {Boolean}
   */
  function validUpperCase(str) {
    const reg = /^[A-Z]+$/
    return reg.test(str)
  }

  /**
   * @param {string} str
   * @returns {Boolean}
   */
  function validAlphabets(str) {
    const reg = /^[A-Za-z]+$/
    return reg.test(str)
  }

  /**
   * @param {string} email
   * @returns {Boolean}
   */
  function validEmail(email) {
    const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return reg.test(email)
  }

  /**
   * @param {string} str
   * @returns {Boolean}
   */
  function isString(str) {
    if (typeof str === 'string' || str instanceof String) {
      return true
    }
    return false
  }

  /**
   * @param {Array} arg
   * @returns {Boolean}
   */
  function isArray(arg) {
    if (typeof Array.isArray === 'undefined') {
      return Object.prototype.toString.call(arg) === '[object Array]'
    }
    return Array.isArray(arg)
  }

  /**
   * 判断是否是json
   *
   * @param str
   * @returns {boolean}
   */
  function isJSON(str) {
    if (typeof str === 'string') {
      try {
        JSON.parse(str)
        return true
      } catch (e) {
        return false
      }
    }
    return false
  }

  Object.defineProperty(exports, "isExternal", {
    enumerable: true,
    get: function() {
      return isExternal;
    }
  });
  Object.defineProperty(exports, "validUsername", {
    enumerable: true,
    get: function() {
      return validUsername;
    }
  });
  Object.defineProperty(exports, "validURL", {
    enumerable: true,
    get: function() {
      return validURL;
    }
  });
  Object.defineProperty(exports, "validLowerCase", {
    enumerable: true,
    get: function() {
      return validLowerCase;
    }
  });
  Object.defineProperty(exports, "validUpperCase", {
    enumerable: true,
    get: function() {
      return validUpperCase;
    }
  });
  Object.defineProperty(exports, "validAlphabets", {
    enumerable: true,
    get: function() {
      return validAlphabets;
    }
  });
  Object.defineProperty(exports, "validEmail", {
    enumerable: true,
    get: function() {
      return validEmail;
    }
  });
  Object.defineProperty(exports, "isString", {
    enumerable: true,
    get: function() {
      return isString;
    }
  });
  Object.defineProperty(exports, "isArray", {
    enumerable: true,
    get: function() {
      return isArray;
    }
  });
  Object.defineProperty(exports, "isJSON", {
    enumerable: true,
    get: function() {
      return isJSON;
    }
  });
});
