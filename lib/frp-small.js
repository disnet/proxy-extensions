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

  var makeIdHandler, merge, numBinaryOps, numUnaryOps, reactive, reactiveSecret, root, stream, streamSecret, unwrap, wrap;
  var __slice = Array.prototype.slice;

  makeIdHandler = utils.makeIdHandler, merge = utils.merge, numUnaryOps = utils.numUnaryOps, numBinaryOps = utils.numBinaryOps;

  reactiveSecret = {};

  streamSecret = {};

  root = Proxy.dispatchTest(typeof global !== "undefined" && global !== null) ? global : this;

  wrap = function(x) {
    var _this = this;
    if (Proxy.dispatchTest(Proxy.dispatchBinary('instanceof', x, Behavior, function() { return x instanceof Behavior;}))) {
      return reactive(x);
    } else if (Proxy.dispatchTest(Proxy.dispatchBinary('instanceof', x, EventStream, function() { return x instanceof EventStream;}))) {
      return stream(x);
    } else if (Proxy.dispatchTest(Proxy.dispatchBinary('===', Proxy.dispatchUnary('typeof', x, function() { return typeof x; }), 'function', function() { return Proxy.dispatchUnary('typeof', x, function() { return typeof x; }) === 'function';}))) {
      return function() {
        var arg, args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return wrap(x.apply(_this, (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = args.length; _i < _len; _i++) {
            arg = args[_i];
            _results.push(unwrap(arg));
          }
          return _results;
        })()));
      };
    } else {
      return x;
    }
  };

  unwrap = function(x) {
    var rh, sh;
    rh = Proxy.unProxy(reactiveSecret, x);
    sh = Proxy.unProxy(streamSecret, x);
    if (Proxy.dispatchTest(rh)) {
      return rh.beh;
    } else if (Proxy.dispatchTest(sh)) {
      return sh.evt;
    } else {
      return x;
    }
  };

  reactive = function(x) {
    var b, handler;
    b = Proxy.dispatchTest(Proxy.dispatchBinary('instanceof', x, Behavior, function() { return x instanceof Behavior;})) ? x : startsWith(receiverE(), x);
    handler = merge(makeIdHandler(b), {
      beh: b,
      get: function(r, name) {
        return (wrap.bind(handler.beh))(handler.beh[name]);
      },
      unary: function(o) {
        return reactive(liftB(numUnaryOps[o], this.beh));
      },
      left: function(o, r) {
        var h;
        h = Proxy.unProxy(reactiveSecret, r);
        if (Proxy.dispatchTest(h)) {
          return reactive(liftB(numBinaryOps[o], this.beh, h.beh));
        } else {
          return reactive(liftB(numBinaryOps[o], this.beh, r));
        }
      },
      right: function(o, l) {
        return reactive(liftB(numBinaryOps[o], l, this.beh));
      }
    });
    return Proxy.create(handler, null, reactiveSecret);
  };

  stream = function(e) {
    var handler;
    if (Proxy.dispatchTest(Proxy.dispatchUnary('!', (Proxy.dispatchBinary('instanceof', e, EventStream, function() { return e instanceof EventStream;})), function() { return !(Proxy.dispatchBinary('instanceof', e, EventStream, function() { return e instanceof EventStream;})); }))) {
      throw "streams must be built from EventStreams";
    }
    handler = merge(makeIdHandler(e), {
      evt: e,
      get: function(r, name) {
        return (wrap.bind(handler.evt))(handler.evt[name]);
      }
    });
    return Proxy.create(handler, null, streamSecret);
  };

  root.timerB = wrap(timerB);

  root.insertValueB = wrap(insertValueB);

  root.$E = wrap($E);

  root.$B = wrap($B);

}).call(this);
