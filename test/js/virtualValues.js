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

  var HIGH, LOW, addListener, assert, bind, deffun, defgeneric, defmethod, getCurrent, head, i, infoReactive, list, makeUnit, makeVBool, makeVNum, ok, outputHigh, outputLow, reactive, reactiveAlt, split, tail, values, _ref, _ref2, _ref3, _ref4, _ref5;

  assert = require('assert', 'test/cs/virtualValues.coffee');

  require('../../lib/loadVirt', 'test/cs/virtualValues.coffee').patch();

  require('../../lib/loadContracts', 'test/cs/virtualValues.coffee');

  i = require('../../lib/complex', 'test/cs/virtualValues.coffee').i;

  makeUnit = require('../../lib//units', 'test/cs/virtualValues.coffee').makeUnit;

  _ref = require('../../lib/multiple-values', 'test/cs/virtualValues.coffee'), values = _ref.values, bind = _ref.bind;

  _ref2 = require('../../lib/generic-functions', 'test/cs/virtualValues.coffee'), defgeneric = _ref2.defgeneric, defmethod = _ref2.defmethod;

  deffun = require('../../lib/function-operators', 'test/cs/virtualValues.coffee').deffun;

  _ref3 = require('../../lib/list', 'test/cs/virtualValues.coffee'), list = _ref3.list, head = _ref3.head, tail = _ref3.tail, split = _ref3.split;

  _ref4 = require('../../lib/functional-reactive', 'test/cs/virtualValues.coffee'), reactive = _ref4.reactive, getCurrent = _ref4.getCurrent, addListener = _ref4.addListener, reactiveAlt = _ref4.reactiveAlt;

  _ref5 = require('../../lib/info-reactive', 'test/cs/virtualValues.coffee'), infoReactive = _ref5.infoReactive, HIGH = _ref5.HIGH, LOW = _ref5.LOW, outputLow = _ref5.outputLow, outputHigh = _ref5.outputHigh;

  ok = assert;

  makeVNum = function(n) {
    var binaryOps, h, unaryOps;
    unaryOps = {
      '-': function(v) {
        return Proxy.dispatchUnary('-', v, function() { return -v; });
      }
    };
    binaryOps = {
      '+': function(a, b) {
        return Proxy.dispatchBinary('+', a, b, function() { return a + b;});
      },
      '-': function(a, b) {
        return Proxy.dispatchBinary('-', a, b, function() { return a - b;});
      },
      '/': function(a, b) {
        return Proxy.dispatchBinary('/', a, b, function() { return a / b;});
      },
      '*': function(a, b) {
        return Proxy.dispatchBinary('*', a, b, function() { return a * b;});
      }
    };
    h = {
      value: n,
      unary: function(op) {
        return unaryOps[op](this.value);
      },
      left: function(op, right) {
        return binaryOps[op](this.value, right);
      },
      right: function(op, left) {
        return binaryOps[op](left, this.value);
      },
      get: function(myprox, name) {
        throw "Not defined";
      }
    };
    return Proxy.create(h, null, {});
  };

  makeVBool = function(b) {
    var h;
    h = {
      value: b,
      test: function() {
        return this.value;
      },
      get: function(myproxy, name) {
        throw "Not defined";
      }
    };
    return Proxy.create(h, null, {});
  };

  describe("Virtual Number", function() {
    return it("should behave like primitive numbers", function() {
      var p, q;
      p = makeVNum(10);
      q = makeVNum(20);
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchUnary('-', p, function() { return -p; })), Proxy.dispatchUnary('-', 10, function() { return -10; }), function() { return (Proxy.dispatchUnary('-', p, function() { return -p; })) === Proxy.dispatchUnary('-', 10, function() { return -10; });}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('-', p, 2, function() { return p - 2;})), 8, function() { return (Proxy.dispatchBinary('-', p, 2, function() { return p - 2;})) === 8;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('+', p, 2, function() { return p + 2;})), 12, function() { return (Proxy.dispatchBinary('+', p, 2, function() { return p + 2;})) === 12;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('/', p, 2, function() { return p / 2;})), 5, function() { return (Proxy.dispatchBinary('/', p, 2, function() { return p / 2;})) === 5;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('*', p, 2, function() { return p * 2;})), 20, function() { return (Proxy.dispatchBinary('*', p, 2, function() { return p * 2;})) === 20;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('+', 20, p, function() { return 20 + p;})), 30, function() { return (Proxy.dispatchBinary('+', 20, p, function() { return 20 + p;})) === 30;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('-', 20, p, function() { return 20 - p;})), 10, function() { return (Proxy.dispatchBinary('-', 20, p, function() { return 20 - p;})) === 10;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('/', 20, p, function() { return 20 / p;})), 2, function() { return (Proxy.dispatchBinary('/', 20, p, function() { return 20 / p;})) === 2;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('*', 20, p, function() { return 20 * p;})), 200, function() { return (Proxy.dispatchBinary('*', 20, p, function() { return 20 * p;})) === 200;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('+', q, p, function() { return q + p;})), 30, function() { return (Proxy.dispatchBinary('+', q, p, function() { return q + p;})) === 30;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('-', q, p, function() { return q - p;})), 10, function() { return (Proxy.dispatchBinary('-', q, p, function() { return q - p;})) === 10;}));
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('/', q, p, function() { return q / p;})), 2, function() { return (Proxy.dispatchBinary('/', q, p, function() { return q / p;})) === 2;}));
      return ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('*', q, p, function() { return q * p;})), 200, function() { return (Proxy.dispatchBinary('*', q, p, function() { return q * p;})) === 200;}));
    });
  });

  describe("Virtual Boolean", function() {
    return it("should work for conditional statements", function() {
      var bf, bt;
      bt = makeVBool(true);
      bf = makeVBool(false);
      if (Proxy.dispatchTest(bt)) {
        ok(true);
      } else {
        assert("should not reach this branch");
      }
      if (Proxy.dispatchTest(bf)) {
        assert.fail("should not reach this branch");
      } else {
        ok(true);
      }
      if (Proxy.dispatchTest(bt)) {
        ok(true);
      } else {
        assert.fail("should not reach this branch");
      }
      if (Proxy.dispatchTest(bf)) {
        return assert.fail("should not reach this branch");
      } else {
        return ok(true);
      }
    });
  });

  describe("Complex Numbers", function() {
    return it("should work with the basic operations", function() {
      var x, y, z;
      x = Proxy.dispatchBinary('+', 4, Proxy.dispatchBinary('*', 1, i, function() { return 1 * i;}), function() { return 4 + Proxy.dispatchBinary('*', 1, i, function() { return 1 * i;});});
      y = Proxy.dispatchBinary('+', 3, Proxy.dispatchBinary('*', 1, i, function() { return 1 * i;}), function() { return 3 + Proxy.dispatchBinary('*', 1, i, function() { return 1 * i;});});
      z = Proxy.dispatchBinary('+', 7, Proxy.dispatchBinary('*', 2, i, function() { return 2 * i;}), function() { return 7 + Proxy.dispatchBinary('*', 2, i, function() { return 2 * i;});});
      return ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('+', x, y, function() { return x + y;})), z, function() { return (Proxy.dispatchBinary('+', x, y, function() { return x + y;})) === z;}));
    });
  });

  describe("Multiple Values", function() {
    it("should work with base values", function() {
      var v, x, y, _ref6;
      v = values(2, 3);
      _ref6 = bind(v), x = _ref6[0], y = _ref6[1];
      ok(Proxy.dispatchBinary('===', v, 2, function() { return v === 2;}));
      ok(Proxy.dispatchBinary('===', x, 2, function() { return x === 2;}));
      return ok(Proxy.dispatchBinary('===', y, 3, function() { return y === 3;}));
    });
    return it("should work with functions", function() {
      var polar, r, theta, _ref6;
      polar = function(x, y) {
        return values(Math.sqrt(Proxy.dispatchBinary('+', (Proxy.dispatchBinary('*', x, x, function() { return x * x;})), (Proxy.dispatchBinary('*', y, y, function() { return y * y;})), function() { return (Proxy.dispatchBinary('*', x, x, function() { return x * x;})) + (Proxy.dispatchBinary('*', y, y, function() { return y * y;}));})), Math.atan2(y, x));
      };
      ok(Proxy.dispatchBinary('===', (polar(3.0, 4.0)), 5.0, function() { return (polar(3.0, 4.0)) === 5.0;}));
      _ref6 = bind(polar(3.0, 4.0)), r = _ref6[0], theta = _ref6[1];
      ok(Proxy.dispatchBinary('===', r, 5.0, function() { return r === 5.0;}));
      return ok(Proxy.dispatchBinary('===', theta, 0.9272952180016122, function() { return theta === 0.9272952180016122;}));
    });
  });

  describe("Generic functions", function() {
    return it("should work with basic usage", function() {
      var keyInput;
      keyInput = defgeneric();
      defmethod(keyInput, (function(keyName) {
        return Proxy.dispatchBinary('===', keyName, "escape", function() { return keyName === "escape";});
      }), function(keyName) {
        return "quit!";
      });
      defmethod(keyInput, (function(keyName) {
        return Proxy.dispatchBinary('===', keyName, "enter", function() { return keyName === "enter";});
      }), function(keyName) {
        return "do it!";
      });
      ok(Proxy.dispatchBinary('===', (keyInput("escape")), "quit!", function() { return (keyInput("escape")) === "quit!";}));
      return ok(Proxy.dispatchBinary('===', (keyInput("enter")), "do it!", function() { return (keyInput("enter")) === "do it!";}));
    });
  });

  describe("Funciton operators", function() {
    it("should work for composition", function() {
      var f, g;
      f = deffun(function(x) {
        return Proxy.dispatchBinary('*', x, x, function() { return x * x;});
      });
      g = deffun(function(x) {
        return Proxy.dispatchBinary('+', x, 10, function() { return x + 10;});
      });
      ok(Proxy.dispatchBinary('===', ((Proxy.dispatchBinary('+', f, g, function() { return f + g;}))(10)), 400, function() { return ((Proxy.dispatchBinary('+', f, g, function() { return f + g;}))(10)) === 400;}));
      return ok(Proxy.dispatchBinary('===', ((Proxy.dispatchBinary('+', g, f, function() { return g + f;}))(10)), 110, function() { return ((Proxy.dispatchBinary('+', g, f, function() { return g + f;}))(10)) === 110;}));
    });
    return it("should work for currying", function() {
      var c1, c2, c3, curried;
      curried = deffun(function(x, y, z) {
        return Proxy.dispatchBinary('+', Proxy.dispatchBinary('+', x, y, function() { return x + y;}), z, function() { return Proxy.dispatchBinary('+', x, y, function() { return x + y;}) + z;});
      });
      c1 = curried(1);
      c2 = c1(2);
      c3 = c2(3);
      return ok(Proxy.dispatchBinary('===', c3, 6, function() { return c3 === 6;}));
    });
  });

  describe("Lists", function() {
    return it("should behave like immutable lists", function() {
      var a, b, c, h, hd, t, tl, _ref6;
      a = list([1, 2, 3]);
      b = list([4, 5, 6]);
      ok(Proxy.dispatchBinary('===', (Proxy.dispatchBinary('+', a, b, function() { return a + b;})), (list([1, 2, 3, 4, 5, 6])), function() { return (Proxy.dispatchBinary('+', a, b, function() { return a + b;})) === (list([1, 2, 3, 4, 5, 6]));}));
      h = head(a);
      t = tail(a);
      ok(Proxy.dispatchBinary('===', h, 1, function() { return h === 1;}));
      ok(Proxy.dispatchBinary('===', t, (list([2, 3])), function() { return t === (list([2, 3]));}));
      _ref6 = split(a), hd = _ref6[0], tl = _ref6[1];
      ok(Proxy.dispatchBinary('===', hd, 1, function() { return hd === 1;}));
      ok(Proxy.dispatchBinary('===', tl, (list([2, 3])), function() { return tl === (list([2, 3]));}));
      c = Proxy.dispatchBinary('>>', 1, b, function() { return 1 >> b;});
      return ok(Proxy.dispatchBinary('===', c, (list([1, 4, 5, 6])), function() { return c === (list([1, 4, 5, 6]));}));
    });
  });

  describe("FRP", function() {
    it("should work with the standard impl", function() {
      var a, b, x;
      x = reactive(3);
      a = Proxy.dispatchBinary('+', x, 3, function() { return x + 3;});
      b = Proxy.dispatchBinary('+', x, a, function() { return x + a;});
      Proxy.dispatchBinary('===', a, 6, function() { return a === 6;});
      Proxy.dispatchBinary('===', b, 9, function() { return b === 9;});
      x.set(1);
      Proxy.dispatchBinary('===', a, 4, function() { return a === 4;});
      return Proxy.dispatchBinary('===', b, 5, function() { return b === 5;});
    });
    return it("should work with the alternative implementation", function() {
      var a, set, x, _ref6;
      _ref6 = reactiveAlt(), x = _ref6[0], set = _ref6[1];
      a = Proxy.dispatchBinary('+', x, 4, function() { return x + 4;});
      set(4);
      return Proxy.dispatchBinary('===', a, 8, function() { return a === 8;});
    });
  });

  describe("FRP info flow", function() {
    return it("should work like I want", function() {
      var h, l, x, y;
      h = infoReactive(5, HIGH);
      x = Proxy.dispatchBinary('+', h, 5, function() { return h + 5;});
      ok(Proxy.dispatchBinary('===', (outputLow(x)), void 0, function() { return (outputLow(x)) === void 0;}));
      ok(Proxy.dispatchBinary('===', (outputHigh(x)), 10, function() { return (outputHigh(x)) === 10;}));
      h.set(10);
      ok(Proxy.dispatchBinary('===', (outputLow(x)), void 0, function() { return (outputLow(x)) === void 0;}));
      ok(Proxy.dispatchBinary('===', (outputHigh(x)), 15, function() { return (outputHigh(x)) === 15;}));
      l = infoReactive(10, LOW);
      y = Proxy.dispatchBinary('+', l, 5, function() { return l + 5;});
      l.set(infoReactive(15, HIGH));
      ok(Proxy.dispatchBinary('===', (outputLow(y)), 15, function() { return (outputLow(y)) === 15;}));
      return ok(Proxy.dispatchBinary('===', (outputHigh(y)), 20, function() { return (outputHigh(y)) === 20;}));
    });
  });

  describe("Units", function() {
    return it("should work for basic units", function() {
      var g, meter, second;
      meter = makeUnit('meter');
      second = makeUnit('second');
      g = Proxy.dispatchBinary('/', Proxy.dispatchBinary('/', Proxy.dispatchBinary('*', 9.81, meter, function() { return 9.81 * meter;}), second, function() { return Proxy.dispatchBinary('*', 9.81, meter, function() { return 9.81 * meter;}) / second;}), second, function() { return Proxy.dispatchBinary('/', Proxy.dispatchBinary('*', 9.81, meter, function() { return 9.81 * meter;}), second, function() { return Proxy.dispatchBinary('*', 9.81, meter, function() { return 9.81 * meter;}) / second;}) / second;});
      return assert.throws((function() {
        return Proxy.dispatchBinary('+', g, 1, function() { return g + 1;});
      }));
    });
  });

}).call(this);
