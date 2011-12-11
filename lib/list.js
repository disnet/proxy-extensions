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

  var List, arrayEgal, binOps, egal, head, makeList, print, secret, split, tail;

  secret = {};

  print = console.log;

  egal = function(a, b) {
    if (Proxy.dispatchTest(Proxy.dispatchBinary('===', a, b, function() { return a === b;}))) {
      return Proxy.dispatchBinary('||', Proxy.dispatchBinary('!==', a, 0, function() { return a !== 0;}), Proxy.dispatchBinary('===', Proxy.dispatchBinary('/', 1, a, function() { return 1 / a;}), Proxy.dispatchBinary('/', 1, b, function() { return 1 / b;}), function() { return Proxy.dispatchBinary('/', 1, a, function() { return 1 / a;}) === Proxy.dispatchBinary('/', 1, b, function() { return 1 / b;});}), function() { return Proxy.dispatchBinary('!==', a, 0, function() { return a !== 0;}) || Proxy.dispatchBinary('===', Proxy.dispatchBinary('/', 1, a, function() { return 1 / a;}), Proxy.dispatchBinary('/', 1, b, function() { return 1 / b;}), function() { return Proxy.dispatchBinary('/', 1, a, function() { return 1 / a;}) === Proxy.dispatchBinary('/', 1, b, function() { return 1 / b;});});});
    } else {
      return Proxy.dispatchBinary('&&', Proxy.dispatchBinary('!==', a, a, function() { return a !== a;}), Proxy.dispatchBinary('!==', b, b, function() { return b !== b;}), function() { return Proxy.dispatchBinary('!==', a, a, function() { return a !== a;}) && Proxy.dispatchBinary('!==', b, b, function() { return b !== b;});});
    }
  };

  arrayEgal = function(a, b) {
    var el, idx, _len;
    if (Proxy.dispatchTest(egal(a, b))) {
      return true;
    } else if (Proxy.dispatchTest(Proxy.dispatchBinary('&&', Proxy.dispatchBinary('instanceof', a, Array, function() { return a instanceof Array;}), Proxy.dispatchBinary('instanceof', b, Array, function() { return b instanceof Array;}), function() { return Proxy.dispatchBinary('instanceof', a, Array, function() { return a instanceof Array;}) && Proxy.dispatchBinary('instanceof', b, Array, function() { return b instanceof Array;});}))) {
      if (Proxy.dispatchTest(Proxy.dispatchBinary('!==', a.length, b.length, function() { return a.length !== b.length;}))) {
        return false;
      }
      for (idx = 0, _len = a.length; idx < _len; idx++) {
        el = a[idx];
        if (Proxy.dispatchTest(Proxy.dispatchUnary('!', arrayEgal(el, b[idx]), function() { return !arrayEgal(el, b[idx]); }))) {
          return false;
        }
      }
      return true;
    }
  };

  List = (function(a) {
    if (Proxy.dispatchTest(Proxy.unProxy(secret, a))) {
      return true;
    } else {
      return false;
    }
  }).toContract();

  binOps = {
    '+': function(a, b) {
      return makeList(a.concat(b));
    },
    '>>': function(h, t) {
      return makeList([h].concat(t));
    },
    '===': function(a, b) {
      return arrayEgal(a, b);
    }
  };

  makeList = function(a) {
    return Proxy.create({
      array: a,
      get: function(r, name) {
        return this.array[name];
      },
      set: function(r, name, val) {
        throw Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}), "' to '", function() { return Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}) + "' to '";}), val, function() { return Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}), "' to '", function() { return Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}) + "' to '";}) + val;}), "', List is immutable!", function() { return Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}), "' to '", function() { return Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}) + "' to '";}), val, function() { return Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}), "' to '", function() { return Proxy.dispatchBinary('+', "Cannot set '", name, function() { return "Cannot set '" + name;}) + "' to '";}) + val;}) + "', List is immutable!";});
      },
      left: function(o, right) {
        var h;
        h = Proxy.unProxy(secret, right);
        if (Proxy.dispatchTest(h)) {
          return binOps[o](this.array, h.array);
        } else {
          return binOps[o](this.array, right);
        }
      },
      right: function(o, left) {
        return binOps[o](left, this.array);
      }
    }, null, secret);
  };

  exports.list = makeList;

  exports.head = guard(fun([List], Any, {}),head = function(l) {
    var h;
    h = Proxy.unProxy(secret, l);
    if (Proxy.dispatchTest(h)) {
      return h.array[0];
    } else {
      throw "Not a list";
    }
  });

  exports.tail = guard(fun([List], List, {}),tail = function(l) {
    var h;
    h = Proxy.unProxy(secret, l);
    if (Proxy.dispatchTest(h)) {
      return makeList(h.array.slice(1, h.array.length));
    } else {
      throw "Not a List";
    }
  });

  exports.split = guard(fun([List], arr([Any, List]), {}),split = function(l) {
    return [head(l), tail(l)];
  });

}).call(this);
