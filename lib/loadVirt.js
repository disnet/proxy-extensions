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

  var root;

  root = typeof exports !== "undefined" && exports !== null ? exports : this["loadVirt"] = {};

  root.patch = function() {
    var old_create, old_createFunction, proxyMap, valueTrap;
    if (!(Proxy.__vvalues != null)) {
      Proxy.__vvalues = true;
      old_create = Proxy.create;
      old_createFunction = Proxy.createFunction;
      proxyMap = new WeakMap();
      Proxy.create = function(handler, proto, secret) {
        var p;
        p = old_create.call(this, handler, proto);
        proxyMap.set(p, [handler, secret]);
        return p;
      };
      Proxy.createFunction = function(handler, callTrap, constructTrap, secret) {
        var p;
        p = old_createFunction.call(this, handler, callTrap, constructTrap);
        proxyMap.set(p, [handler, secret]);
        return p;
      };
      Proxy.unProxy = function(secret, proxy) {
        var handler, hs, s;
        if (proxy !== Object(proxy)) return false;
        hs = proxyMap.get(proxy);
        if (hs != null) handler = hs[0], s = hs[1];
        if (s && s === secret) {
          return handler;
        } else {
          return false;
        }
      };
      valueTrap = function(trap, proxy) {
        var h;
        h = proxyMap.get(proxy, [false, false])[0];
        if (h && trap in h) return h[trap].bind(h);
      };
      Proxy.dispatchUnary = function(op, val, lazyExpr) {
        if (Proxy.isProxy(val)) {
          return (valueTrap('unary', val))(op);
        } else {
          return lazyExpr();
        }
      };
      Proxy.dispatchBinary = function(op, left, right, lazyExpr) {
        if (Proxy.isProxy(left)) {
          return (valueTrap('left', left))(op, right);
        } else if (Proxy.isProxy(right)) {
          return (valueTrap('right', right))(op, left);
        } else {
          return lazyExpr();
        }
      };
      Proxy.dispatchTest = function(cond) {
        if (Proxy.isProxy(cond)) {
          return (valueTrap('test', cond))();
        } else {
          return cond;
        }
      };
      return Proxy.isProxy = function(p) {
        if (p !== Object(p)) {
          return false;
        } else {
          return proxyMap.has(p);
        }
      };
    }
  };

}).call(this);
