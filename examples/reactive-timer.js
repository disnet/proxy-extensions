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


  window.run = function() {
    var clickTms, elapsed, now, startTm;
    now = timerB(1000);
    startTm = now.valueNow();
    clickTms = $E("reset", "click").snapshotE(now).startsWith(startTm);
    elapsed = Proxy.dispatchBinary('-', now, clickTms, function() { return now - clickTms;});
    return insertValueB(elapsed, "curTime", "innerHTML");
  };

}).call(this);
