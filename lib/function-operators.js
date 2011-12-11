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

  var df, secret;
  var __slice = Array.prototype.slice;

  secret = {};

  df = function(f, fakeArity, partialArgs) {
    var call, h;
    if (Proxy.dispatchTest(partialArgs == null)) partialArgs = [];
    h = {
      partialArgs: partialArgs,
      f: f,
      get: function(r, name) {
        if (Proxy.dispatchTest(Proxy.dispatchBinary('&&', Proxy.dispatchBinary('===', name, 'length', function() { return name === 'length';}), (fakeArity != null), function() { return Proxy.dispatchBinary('===', name, 'length', function() { return name === 'length';}) && (fakeArity != null);}))) {
          return fakeArity;
        } else {
          return f[name];
        }
      },
      left: function(o, r) {
        if (Proxy.dispatchTest(Proxy.dispatchBinary('===', o, '+', function() { return o === '+';}))) {
          return df((function() {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            return f(r.apply(this, args));
          }), r.length);
        }
      }
    };
    call = function() {
      var args, flen;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      flen = Proxy.dispatchTest(fakeArity != null) ? fakeArity : f.length;
      if (Proxy.dispatchTest(Proxy.dispatchBinary('<', (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})), flen, function() { return (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})) < flen;}))) {
        return df(f, null, h.partialArgs.concat(args));
      } else if (Proxy.dispatchTest(Proxy.dispatchBinary('>', (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})), flen, function() { return (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})) > flen;}))) {
        throw Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', "Too many arguments: supplied ", (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})), function() { return "Too many arguments: supplied " + (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;}));}), " but was expecting ", function() { return Proxy.dispatchBinary('+', "Too many arguments: supplied ", (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})), function() { return "Too many arguments: supplied " + (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;}));}) + " but was expecting ";}), f.length, function() { return Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', "Too many arguments: supplied ", (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})), function() { return "Too many arguments: supplied " + (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;}));}), " but was expecting ", function() { return Proxy.dispatchBinary('+', "Too many arguments: supplied ", (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;})), function() { return "Too many arguments: supplied " + (Proxy.dispatchBinary('+', args.length, h.partialArgs.length, function() { return args.length + h.partialArgs.length;}));}) + " but was expecting ";}) + f.length;});
      } else {
        return f.apply(this, h.partialArgs.concat(args));
      }
    };
    return Proxy.createFunction(h, call, call);
  };

  exports.deffun = function(f) {
    return df(f, null);
  };

}).call(this);
