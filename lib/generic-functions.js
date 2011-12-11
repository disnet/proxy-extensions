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

  var defgeneric, defmethod, secret;
  var __slice = Array.prototype.slice;

  secret = {};

  exports.defgeneric = defgeneric = function() {
    var call, construct, h;
    h = {
      paramPredicates: [],
      test: function() {
        return true;
      }
    };
    call = function() {
      var args, check, predicate, res;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (Proxy.dispatchTest(Proxy.dispatchBinary('===', h.paramPredicates.length, 0, function() { return h.paramPredicates.length === 0;}))) {
        throw "no method specializations defined";
      }
      check = function(paramPredicates) {
        if (Proxy.dispatchTest(Proxy.dispatchBinary('!==', args.length, paramPredicates.length, function() { return args.length !== paramPredicates.length;}))) {
          return false;
        } else {
          return args.every(function(arg, index) {
            return Proxy.dispatchBinary('&&', (paramPredicates[index] != null), paramPredicates[index](arg), function() { return (paramPredicates[index] != null) && paramPredicates[index](arg);});
          });
        }
      };
      res = (function() {
        var _i, _len, _ref, _results;
        _ref = h.paramPredicates;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          predicate = _ref[_i];
          if (Proxy.dispatchTest(check(predicate[0]))) _results.push(predicate[1]);
        }
        return _results;
      })();
      if (Proxy.dispatchTest(Proxy.dispatchBinary('!==', (Proxy.dispatchTest(res != null) ? res.length : void 0), 1, function() { return (Proxy.dispatchTest(res != null) ? res.length : void 0) !== 1;}))) {
        throw "multiple specializations match";
      } else {
        return res[0].apply(this, args);
      }
    };
    construct = function() {
      throw "not defined";
    };
    return Proxy.createFunction(h, call, construct, secret);
  };

  exports.defmethod = defmethod = function() {
    var body, f, h, preds, rest;
    f = arguments[0], rest = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    h = Proxy.unProxy(secret, f);
    if (Proxy.dispatchTest(h)) {
      if (Proxy.dispatchTest(Proxy.dispatchBinary('===', rest.length, 0, function() { return rest.length === 0;}))) {
        throw "must define a body";
      } else {
        preds = rest.slice(0, (Proxy.dispatchBinary('-', rest.length, 1, function() { return rest.length - 1;})));
        body = rest[Proxy.dispatchBinary('-', rest.length, 1, function() { return rest.length - 1;})];
        return h.paramPredicates.push([preds, body]);
      }
    } else {
      throw "not a generic function";
    }
  };

}).call(this);
