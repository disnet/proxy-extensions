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

  var FlapjaxBehavior, Reactive, Unit, fj, makeIdHandler, merge, numBinaryOps, numUnaryOps, reactive, reactiveSecret, root, stream, streamSecret, _ref;

  if (Proxy.dispatchTest(typeof require !== "undefined" && require !== null)) {
    _ref = require('./utils', 'src/frp.coffee'), makeIdHandler = _ref.makeIdHandler, merge = _ref.merge, numUnaryOps = _ref.numUnaryOps, numBinaryOps = _ref.numBinaryOps;
    fj = require("./flapjax", 'src/frp.coffee');
  } else {
    makeIdHandler = utils.makeIdHandler, merge = utils.merge, numUnaryOps = utils.numUnaryOps, numBinaryOps = utils.numBinaryOps;
    fj = flapjax;
  }

  reactiveSecret = {};

  streamSecret = {};

  root = Proxy.dispatchTest(typeof exports !== "undefined" && exports !== null) ? exports : this["frp"] = {};

  Unit = (function(x) {
    return Proxy.dispatchBinary('===', x, void 0, function() { return x === void 0;});
  }).toContract();

  FlapjaxBehavior = (function(x) {
    return Proxy.dispatchBinary('instanceof', x, fj.Behavior, function() { return x instanceof fj.Behavior;});
  }).toContract();

  Reactive = (function(x) {
    if (Proxy.dispatchTest(Proxy.unProxy(reactiveSecret, x))) {
      return true;
    } else {
      return false;
    }
  }).toContract();

  reactive = guard(fun([Any], Reactive, {}),function(x) {
    var b, handler, p;
    if (Proxy.dispatchTest(Proxy.dispatchBinary('instanceof', x, fj.Behavior, function() { return x instanceof fj.Behavior;}))) {
      b = x;
    } else {
      b = fj.startsWith(fj.receiverE(), x);
    }
    handler = merge(makeIdHandler(), {
      beh: b
    });
    handler.unary = function(o) {
      return reactive(fj.liftB(numUnaryOps[o], this.beh));
    };
    handler.left = function(o, r) {
      var h;
      h = Proxy.unProxy(reactiveSecret, r);
      if (Proxy.dispatchTest(h)) {
        return reactive(fj.liftB(numBinaryOps[o], this.beh, h.beh));
      } else {
        return reactive(fj.liftB(numBinaryOps[o], this.beh, r));
      }
    };
    handler.right = function(o, l) {
      return reactive(fj.liftB(numBinaryOps[o], l, this.beh));
    };
    p = Proxy.create(handler, null, reactiveSecret);
    p.set = function(n) {
      var h;
      h = Proxy.unProxy(reactiveSecret, this);
      return h.beh.sendBehavior(n);
    };
    p.curr = function() {
      var h;
      h = Proxy.unProxy(reactiveSecret, this);
      return h.beh.valueNow();
    };
    p["if"] = function(tru, fls) {
      var h;
      h = Proxy.unProxy(reactiveSecret, this);
      return reactive(h.beh.ifB(tru, fls));
    };
    p.change = function(fn) {
      handler.beh.changes().mapE(fn);
      return;
    };
    return p;
  });

  reactive = reactive.use("self");

  stream = function(e) {
    var handler, p;
    if (Proxy.dispatchTest(Proxy.dispatchUnary('!', (Proxy.dispatchBinary('instanceof', e, fj.EventStream, function() { return e instanceof fj.EventStream;})), function() { return !(Proxy.dispatchBinary('instanceof', e, fj.EventStream, function() { return e instanceof fj.EventStream;})); }))) {
      throw "not implemented yet";
    }
    handler = merge(makeIdHandler(), {
      evt: e
    });
    p = Proxy.create(handler, null, streamSecret);
    p.snapshot = function(val) {
      var rh;
      rh = Proxy.unProxy(reactiveSecret, val);
      if (Proxy.dispatchTest(rh)) {
        return stream(handler.evt.snapshotE(rh.beh));
      } else {
        throw "${val} must be a reactive";
      }
    };
    p.startsWith = function(init) {
      return reactive(handler.evt.startsWith(init));
    };
    return p;
  };

  root.reactive = guard(fun([Any], Reactive, {}),reactive);

  root.reactiveTimer = function(interval) {
    return reactive(fj.timerB(interval));
  };

  root.$E = function(el, evt) {
    return stream(fj.extractEventE(el, evt));
  };

  root.dom = function(sel) {
    var jq;
    jq = jQuery(sel);
    return {
      text: function(value) {
        jq.text(value.curr());
        return value.change(function(v) {
          return jq.text(v);
        });
      }
    };
  };

  root.insertValue = function(value, dest, field) {
    var rh, sh;
    rh = Proxy.unProxy(reactiveSecret, value);
    sh = Proxy.unProxy(streamSecret, value);
    if (Proxy.dispatchTest(rh)) {
      return fj.insertValueB(rh.beh, dest, field);
    } else if (Proxy.dispatchTest(sh)) {
      return fj.insertValueE(sh.evt, dest, field);
    } else {
      throw "not implemented";
    }
  };

}).call(this);
