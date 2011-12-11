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

  var Complex, binOps, isComplex, makeComplex, secret, unaryOps;

  secret = {};

  unaryOps = {
    '-': function(r, i) {
      return makeComplex(Proxy.dispatchUnary('-', r, function() { return -r; }), Proxy.dispatchUnary('-', i, function() { return -i; }));
    },
    'typeof': function(r, i) {
      return 'number';
    }
  };

  binOps = {
    '+': function(r1, i1, r2, i2) {
      return makeComplex(Proxy.dispatchBinary('+', r1, r2, function() { return r1 + r2;}), Proxy.dispatchBinary('+', i1, i2, function() { return i1 + i2;}));
    },
    '*': function(r1, i1, r2, i2) {
      return makeComplex(Proxy.dispatchBinary('-', Proxy.dispatchBinary('*', r1, r2, function() { return r1 * r2;}), Proxy.dispatchBinary('*', i1, i2, function() { return i1 * i2;}), function() { return Proxy.dispatchBinary('*', r1, r2, function() { return r1 * r2;}) - Proxy.dispatchBinary('*', i1, i2, function() { return i1 * i2;});}), Proxy.dispatchBinary('+', Proxy.dispatchBinary('*', i1, r2, function() { return i1 * r2;}), Proxy.dispatchBinary('*', r1, i2, function() { return r1 * i2;}), function() { return Proxy.dispatchBinary('*', i1, r2, function() { return i1 * r2;}) + Proxy.dispatchBinary('*', r1, i2, function() { return r1 * i2;});}));
    },
    '===': function(r1, i1, r2, i2) {
      return Proxy.dispatchBinary('&&', (Proxy.dispatchBinary('===', r1, r2, function() { return r1 === r2;})), (Proxy.dispatchBinary('===', i1, i2, function() { return i1 === i2;})), function() { return (Proxy.dispatchBinary('===', r1, r2, function() { return r1 === r2;})) && (Proxy.dispatchBinary('===', i1, i2, function() { return i1 === i2;}));});
    }
  };

  Complex = (function(x) {
    return isComplex(x);
  }).toContract();

  makeComplex = guard(fun([Num, Num], Complex, {}),function(r, i) {
    var h;
    h = {
      real: r,
      imag: i,
      unary: function(o) {
        return unaryOps[o](r, i);
      },
      left: function(o, right) {
        h = Proxy.unProxy(secret, right);
        if (Proxy.dispatchTest(h)) {
          return binOps[o](r, i, h.real, h.imag);
        } else {
          return binOps[o](r, i, y, 0);
        }
      },
      right: function(o, left) {
        return binOps[o](left, 0, r, i);
      },
      test: function() {
        return true;
      },
      getPropertyDescriptor: function(name) {
        return;
      }
    };
    return Proxy.create(h, null, secret);
  });

  exports.makeComplex = makeComplex;

  makeComplex = makeComplex.use("self");

  exports.isComplex = guard(fun([Any], Bool, {}),isComplex = function(x) {
    if (Proxy.dispatchTest(Proxy.unProxy(secret, x))) {
      return true;
    } else {
      return false;
    }
  });

  exports.i = makeComplex(0, 1);

}).call(this);
