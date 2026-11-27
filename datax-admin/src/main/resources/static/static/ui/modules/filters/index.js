/* Original readable DataX Web UI source: filters/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("filters/index", function(module, exports, require) {
  // import parseTime, formatTime and set to filter

  /**
   * Show plural label if time is plural number
   * @param {number} time
   * @param {string} label
   * @return {string}
   */
  function pluralize(time, label) {
    if (time === 1) {
      return time + label
    }
    return time + label + 's'
  }

  /**
   * @param {number} time
   */
  function timeAgo(time) {
    const between = Date.now() / 1000 - Number(time)
    if (between < 3600) {
      return pluralize(~~(between / 60), ' minute')
    } else if (between < 86400) {
      return pluralize(~~(between / 3600), ' hour')
    } else {
      return pluralize(~~(between / 86400), ' day')
    }
  }

  /**
   * Number formatting
   * like 10000 => 10k
   * @param {number} num
   * @param {number} digits
   */
  function numberFormatter(num, digits) {
    const si = [{
      value: 1E18,
      symbol: 'E'
    }, {
      value: 1E15,
      symbol: 'P'
    }, {
      value: 1E12,
      symbol: 'T'
    }, {
      value: 1E9,
      symbol: 'G'
    }, {
      value: 1E6,
      symbol: 'M'
    }, {
      value: 1E3,
      symbol: 'k'
    }]
    for (let i = 0; i < si.length; i++) {
      if (num >= si[i].value) {
        return (num / si[i].value + 0.1).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') + si[i].symbol
      }
    }
    return num.toString()
  }

  /**
   * 10000 => "10,000"
   * @param {number} num
   */
  function toThousandFilter(num) {
    return (+num || 0).toString().replace(/^-?\d+/g, m => m.replace(/(?=(?!\b)(\d{3})+$)/g, ','))
  }

  /**
   * Upper case first char
   * @param {String} string
   */
  function uppercaseFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  Object.defineProperty(exports, "parseTime", {
    enumerable: true,
    get: function() {
      return require("utils/index").parseTime;
    }
  });
  Object.defineProperty(exports, "formatTime", {
    enumerable: true,
    get: function() {
      return require("utils/index").formatTime;
    }
  });
  Object.defineProperty(exports, "timeAgo", {
    enumerable: true,
    get: function() {
      return timeAgo;
    }
  });
  Object.defineProperty(exports, "numberFormatter", {
    enumerable: true,
    get: function() {
      return numberFormatter;
    }
  });
  Object.defineProperty(exports, "toThousandFilter", {
    enumerable: true,
    get: function() {
      return toThousandFilter;
    }
  });
  Object.defineProperty(exports, "uppercaseFirst", {
    enumerable: true,
    get: function() {
      return uppercaseFirst;
    }
  });
});
