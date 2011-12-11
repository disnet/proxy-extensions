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

  var makeRequest, sendToServer, setupSavebox;

  makeRequest = function(v) {
    return {
      url: "/saveValue",
      fields: {
        value: v,
        request: "post"
      }
    };
  };

  sendToServer = function(v) {
    return console.log(Proxy.dispatchBinary('+', "Sending: ", v.fields.value, function() { return "Sending: " + v.fields.value;}));
  };

  setupSavebox = function(saveWhen) {
    var requests;
    requests = saveWhen.snapshotE($B("edit")).mapE(makeRequest);
    return requests.mapE(sendToServer);
  };

  window.run = function() {
    return setupSavebox((timerE(10000)).mergeE($E("btnSave", "click")));
  };

}).call(this);
