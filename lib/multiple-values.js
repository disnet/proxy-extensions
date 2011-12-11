(function() {(function() {
  var old_require;
  if (typeof require !== 'undefined' && require !== null) {
    old_require = require;
    require = function(mod, filename) {
      var key, m = old_require(mod);
      for(key in m) {
        if(typeof(m[key]) && m[key].hasOwnProperty && m[key].hasOwnProperty('use')) {
          m[key] = m[key].use(filename, mod);
        }
      }
      return m;
    };
    for(var key in old_require) {
      require[key] = old_require[key];
    }
  }
})();

  var binOps, bind, secret, unaryOps, values;
  var __slice = Array.prototype.slice;

  secret = {};

  unaryOps = {
    '-': function(x) {
      return Proxy.dispatchUnary('-', x, function() { return -x; });
    },
    '!': function(x) {
      return Proxy.dispatchUnary('!', x, function() { return !x; });
    }
  };

  binOps = {
    '+': function(x, y) {
      return Proxy.dispatchBinary('+', x, y, function() { return x + y;});
    },
    '-': function(x, y) {
      return Proxy.dispatchBinary('-', x, y, function() { return x - y;});
    },
    '*': function(x, y) {
      return Proxy.dispatchBinary('*', x, y, function() { return x * y;});
    },
    '/': function(x, y) {
      return Proxy.dispatchBinary('/', x, y, function() { return x / y;});
    },
    '&&': function(x, y) {
      return Proxy.dispatchBinary('&&', x, y, function() { return x && y;});
    },
    '||': function(x, y) {
      return Proxy.dispatchBinary('||', x, y, function() { return x || y;});
    },
    '===': function(x, y) {
      return Proxy.dispatchBinary('===', x, y, function() { return x === y;});
    },
    '!==': function(x, y) {
      return Proxy.dispatchBinary('!==', x, y, function() { return x !== y;});
    }
  };

  exports.values = values = function() {
    var h, vals;
    vals = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    h = {
      vals: vals,
      unary: function(o) {
        return unaryOps[o](this.vals[0]);
      },
      left: function(o, right) {
        h = Proxy.unProxy(secret, right);
        if (Proxy.dispatchTest(h)) {
          return binOps[o](this.vals[0], h.vals[0]);
        } else {
          return binOps[o](this.vals[0], right);
        }
      },
      right: function(o, left) {
        return binOps[o](left, this.vals[0]);
      },
      test: function() {
        return this.vals[0];
      }
    };
    return Proxy.create(h, null, secret);
  };

  exports.bind = bind = function(v) {
    var h;
    h = Proxy.unProxy(secret, v);
    if (Proxy.dispatchTest(h)) {
      return h.vals;
    } else {
      return [];
    }
  };

}).call(this);
