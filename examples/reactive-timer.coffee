window.run = ->
  now = timerB 1000
  startTm = now.valueNow()
  clickTms = $E("reset", "click").snapshotE(now).startsWith startTm
  elapsed = now - clickTms
  insertValueB elapsed, "curTime", "innerHTML"

window.test = ->
  o = reactive {}
  o.foo = "orig"
  o.sendBehavior foo: "new"
  o.foo


  # filter = (pred, lst) -> val for val in lst if pred val

