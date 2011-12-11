{makeIdHandler, merge} = require './utils'
secret = {}
STOP = {}

id = (x) -> x

unaryOps = 
  '!': (x) -> !x
  '-': (x) -> -x

binaryOps =
  '+': (x, y) -> x + y
  '-': (x, y) -> x - y
  '*': (x, y) -> x * y
  '/': (x, y) -> x / y
  '===': (x, y) -> x is y
  '!==': (x, y) -> x isnt y

Reactive = ?!(x) -> if Proxy.unProxy secret, x then true else false
StopVal = ?!(x) -> x is STOP

# quasi-flapjax style FR
makeReactive :: (Null or [...Reactive], (Any) -> Any or StopVal, Any?) -> Reactive
makeReactive = (source, update, value = null) ->
  handler = merge makeIdHandler(),
    sinks: []
    value: value
    update: update

  handler.sources = if source? then source else []

  p = Proxy.create handler, null, secret
  handler.left = (o, r) ->
      src = p
      upd = (t) -> binaryOps[o] t, r
      h = Proxy.unProxy secret, r
      if h
        val = binaryOps[o] @.value, h.value
        makeReactive [src], upd, val
      else
        val = binaryOps[o] @.value, r
        makeReactive [src], upd, val
  handler.right = (o, l) ->
    src = p
    upd = (t) -> binaryOps[o] l, t
    val = binaryOps[o] l, @.value
    makeReactive [src], upd, val
  handler.test = (c) -> true

  handler.sources.forEach (s) ->
    h = Proxy.unProxy secret, s
    if h
      h.sinks.push p
    else
      throw "Source is not a reactive value!"
  p.set = (x) ->
    upd = handler.update x
    if upd isnt STOP
      handler.value = upd 
      s.set upd for s in handler.sinks
  p
makeReactive = makeReactive.use "self"




reactiveAlt = ->
  value = null
  listeners = []
  listen = (f) ->
    listeners.push f
    f value if value isnt null
  set = (x) ->
    value = x
    listeners.forEach (f) -> f x
  reactiveFrom = (f) ->
    [r, sett] = reactiveAlt()
    listen (v) -> sett(f v)
    r
  
  handler =
    listen: listen
    current: -> value
    left: (o, r) ->
      h = Proxy.unProxy secret, r
      if h
        [rr, sett] = reactiveAlt()
        listen (v) -> sett(binaryOps[o] v, h.current())
        handler.listen (v) -> sett(binaryOps[o] value, v)
        rr
      else      
        reactiveFrom (v) -> binaryOps[o] v, r
    right: (o, l) -> reactiveFrom (v) -> binaryOps[o] l, v

  p = Proxy.create handler, null, secret
  [p, set]

exports.reactive :: (Any) -> Reactive
exports.reactive = (x) -> makeReactive null, id, x

exports.reactiveAlt = reactiveAlt

exports.getCurrent :: (Reactive) -> Any
exports.getCurrent = (r) -> 
  h = Proxy.unProxy secret, r
  h.current()

exports.addListener :: (Reactive) -> Any
exports.addListener = (r, f) -> 
  h = Proxy.unProxy secret, r
  h.listen(f)
