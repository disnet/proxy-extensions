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

  var HIGH, LOW, Label, Reactive, STOP, StopVal, binaryOps, getValue, id, join, makeIdHandler, makeReactive, merge, secret, unaryOps, _ref;

  _ref = require('./utils', 'src/info-reactive.coffee'), makeIdHandler = _ref.makeIdHandler, merge = _ref.merge;

  secret = {};

  STOP = {};

  exports.HIGH = HIGH = 1;

  exports.LOW = LOW = 0;

  Label = (function(x) {
    return Proxy.dispatchBinary('||', Proxy.dispatchBinary('===', x, HIGH, function() { return x === HIGH;}), Proxy.dispatchBinary('===', x, LOW, function() { return x === LOW;}), function() { return Proxy.dispatchBinary('===', x, HIGH, function() { return x === HIGH;}) || Proxy.dispatchBinary('===', x, LOW, function() { return x === LOW;});});
  }).toContract();

  join = guard(fun([Label, Label], Label, {}),function(a, b) {
    if (Proxy.dispatchTest(Proxy.dispatchBinary('||', Proxy.dispatchBinary('===', a, HIGH, function() { return a === HIGH;}), Proxy.dispatchBinary('===', b, HIGH, function() { return b === HIGH;}), function() { return Proxy.dispatchBinary('===', a, HIGH, function() { return a === HIGH;}) || Proxy.dispatchBinary('===', b, HIGH, function() { return b === HIGH;});}))) {
      return HIGH;
    } else {
      return LOW;
    }
  });

  join = join.use("self");

  id = function(x) {
    return x;
  };

  unaryOps = {
    '!': function(x) {
      return Proxy.dispatchUnary('!', x, function() { return !x; });
    },
    '-': function(x) {
      return Proxy.dispatchUnary('-', x, function() { return -x; });
    }
  };

  binaryOps = {
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
    '===': function(x, y) {
      return Proxy.dispatchBinary('===', x, y, function() { return x === y;});
    },
    '!==': function(x, y) {
      return Proxy.dispatchBinary('!==', x, y, function() { return x !== y;});
    }
  };

  Reactive = (function(x) {
    if (Proxy.dispatchTest(Proxy.unProxy(secret, x))) {
      return true;
    } else {
      return false;
    }
  }).toContract();

  StopVal = (function(x) {
    return Proxy.dispatchBinary('===', x, STOP, function() { return x === STOP;});
  }).toContract();

  getValue = guard(fun([arr([Num, Num]), Label], Num, {}),function(v, label) {
    if (Proxy.dispatchTest(Proxy.dispatchBinary('===', v[label], void 0, function() { return v[label] === void 0;}))) {
      return v[LOW];
    } else {
      return v[label];
    }
  });

  getValue = getValue.use("self");

  makeReactive = guard(fun([or(Null, arr([___(Reactive)])), fun([Any], or(Any, StopVal), {}), opt(Any), opt(Label)], Reactive, {}),function(source, update, value, label) {
    var handler, p;
    if (Proxy.dispatchTest(value == null)) value = null;
    if (Proxy.dispatchTest(label == null)) label = LOW;
    handler = merge(makeIdHandler(), {
      sinks: [],
      value: [void 0, void 0],
      update: update,
      label: label
    });
    handler.value[label] = value;
    handler.sources = Proxy.dispatchTest(source != null) ? source : [];
    p = Proxy.create(handler, null, secret);
    handler.left = function(o, r) {
      var h, src, upd, val;
      src = p;
      h = Proxy.unProxy(secret, r);
      if (Proxy.dispatchTest(h)) {
        upd = function(t) {
          var hand;
          hand = Proxy.unProxy(secret, t);
          if (Proxy.dispatchTest(hand)) {
            return binaryOps[o](getValue(hand.value, hand.label), getValue(h.value, h.label));
          } else {
            return binaryOps[o](t, getValue(h.value, h.label));
          }
        };
        val = binaryOps[o](getValue(this.value, this.label), getValue(h.value, h.label));
        return makeReactive([src], upd, val, join(this.label, h.label));
      } else {
        upd = function(t) {
          var hand;
          hand = Proxy.unProxy(secret, t);
          if (Proxy.dispatchTest(hand)) {
            return binaryOps[o](getValue(hand.value, hand.label), r);
          } else {
            return binaryOps[o](t, r);
          }
        };
        val = binaryOps[o](getValue(this.value, this.label), r);
        return makeReactive([src], upd, val, this.label);
      }
    };
    handler.right = function(o, l) {
      var src, upd, val;
      src = p;
      upd = function(t) {
        return binaryOps[o](l, t);
      };
      val = binaryOps[o](l, getValue(this.value, this.label));
      return makeReactive([src], upd, val, this.label);
    };
    handler.test = function(c) {
      return true;
    };
    handler.sources.forEach(function(s) {
      var h;
      h = Proxy.unProxy(secret, s);
      if (Proxy.dispatchTest(h)) {
        return h.sinks.push(p);
      } else {
        throw "Source is not a reactive value!";
      }
    });
    p.set = function(x) {
      var h, l, s, upd, _i, _len, _ref2, _results;
      h = Proxy.unProxy(secret, x);
      if (Proxy.dispatchTest(h)) {
        l = join(handler.label, h.label);
      } else {
        l = handler.label;
      }
      upd = handler.update(x);
      if (Proxy.dispatchTest(Proxy.dispatchBinary('!==', upd, STOP, function() { return upd !== STOP;}))) {
        handler.value[l] = upd;
        _ref2 = handler.sinks;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          s = _ref2[_i];
          _results.push(s.set(upd));
        }
        return _results;
      }
    };
    return p;
  });

  makeReactive = makeReactive.use("self");

  exports.outputLow = function(x) {
    var h;
    h = Proxy.unProxy(secret, x);
    if (Proxy.dispatchTest(h)) {
      return h.value[LOW];
    } else {
      return x;
    }
  };

  exports.outputHigh = function(x) {
    var h;
    h = Proxy.unProxy(secret, x);
    if (Proxy.dispatchTest(h)) {
      if (Proxy.dispatchTest(Proxy.dispatchBinary('!==', h.value[HIGH], void 0, function() { return h.value[HIGH] !== void 0;}))) {
        return h.value[HIGH];
      } else {
        return h.value[LOW];
      }
    } else {
      return x;
    }
  };

  exports.infoReactive = function(number, label) {
    return makeReactive(null, id, number, label);
  };

}).call(this);
