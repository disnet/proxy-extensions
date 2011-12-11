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

  var assert, fj, frp, id, ok;

  assert = require('assert', 'test/cs/frp.coffee');

  require('../../lib/loadVirt', 'test/cs/frp.coffee').patch();

  require('../../lib/loadContracts', 'test/cs/frp.coffee');

  fj = require("../../lib/flapjax", 'test/cs/frp.coffee');

  frp = require("../../lib/frp", 'test/cs/frp.coffee');

  ok = assert;

  id = function(x) {
    return x;
  };

  describe('flapjax', function() {
    it("works with the basic usage of core flapjax", function() {
      var nowB, time;
      nowB = fj.timerB(1000);
      time = nowB.valueNow();
      console.log(time);
      return fj.disableTimer(nowB);
    });
    return it("works with virtual values for basic numbers and bools", function() {
      var a, isfive, min, react_bool, x, y, z;
      x = frp.reactive(5);
      react_bool = frp.reactive(true);
      y = Proxy.dispatchBinary('+', x, 5, function() { return x + 5;});
      a = Proxy.dispatchBinary('+', 5, x, function() { return 5 + x;});
      z = Proxy.dispatchBinary('+', x, y, function() { return x + y;});
      min = Proxy.dispatchUnary('-', x, function() { return -x; });
      isfive = Proxy.dispatchBinary('===', x, 5, function() { return x === 5;});
      ok(Proxy.dispatchBinary('===', x.curr(), 5, function() { return x.curr() === 5;}));
      ok(Proxy.dispatchBinary('===', y.curr(), 10, function() { return y.curr() === 10;}));
      ok(Proxy.dispatchBinary('===', a.curr(), 10, function() { return a.curr() === 10;}));
      ok(Proxy.dispatchBinary('===', z.curr(), 15, function() { return z.curr() === 15;}));
      ok(Proxy.dispatchBinary('===', min.curr(), Proxy.dispatchUnary('-', 5, function() { return -5; }), function() { return min.curr() === Proxy.dispatchUnary('-', 5, function() { return -5; });}));
      ok(Proxy.dispatchBinary('===', isfive.curr(), true, function() { return isfive.curr() === true;}));
      x.set(10);
      ok(Proxy.dispatchBinary('===', x.curr(), 10, function() { return x.curr() === 10;}));
      ok(Proxy.dispatchBinary('===', y.curr(), 15, function() { return y.curr() === 15;}));
      ok(Proxy.dispatchBinary('===', a.curr(), 15, function() { return a.curr() === 15;}));
      ok(Proxy.dispatchBinary('===', z.curr(), 25, function() { return z.curr() === 25;}));
      ok(Proxy.dispatchBinary('===', min.curr(), Proxy.dispatchUnary('-', 10, function() { return -10; }), function() { return min.curr() === Proxy.dispatchUnary('-', 10, function() { return -10; });}));
      ok(Proxy.dispatchBinary('===', isfive.curr(), false, function() { return isfive.curr() === false;}));
      return it("works with virtual values for conditionals", function() {
        var res;
        x = frp.reactive(5);
        res = (Proxy.dispatchBinary('===', x, 5, function() { return x === 5;}))["if"](true, false);
        ok(Proxy.dispatchBinary('===', res.curr(), true, function() { return res.curr() === true;}));
        x.set(10);
        return ok(Proxy.dispatchBinary('===', res.curr(), false, function() { return res.curr() === false;}));
      });
    });
  });

}).call(this);
