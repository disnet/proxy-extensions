if require?
  {makeIdHandler, merge, numUnaryOps, numBinaryOps} = require './utils'
  fj = require "./flapjax"
else
  {makeIdHandler, merge, numUnaryOps, numBinaryOps} = utils
  fj = flapjax

reactiveSecret = {}
streamSecret = {}

root = exports ? this["frp"] = {}

Unit = ?!(x) -> x is undefined
FlapjaxBehavior = ?!(x) -> x instanceof fj.Behavior
Reactive = ?!(x) -> if Proxy.unProxy reactiveSecret, x then true else false
# todo: want the following Reactive contract but I think some bug in contracts.js or
# V8 is causing issues with putting an object contract on a Proxy
# Reactive = ?{
#   set: (Num) -> Unit
#   curr: -> Num
# }

reactive :: (Any) -> Reactive
reactive = (x) -> 
  if x instanceof fj.Behavior
    b = x
  else
    # convert our normal value to a behavior
    b = fj.startsWith fj.receiverE(), x

  handler = merge makeIdHandler(),
    beh: b
  
  handler.unary = (o) ->
    reactive (fj.liftB numUnaryOps[o], @.beh)

  handler.left = (o, r) ->
    h = Proxy.unProxy reactiveSecret, r
    if h
      reactive (fj.liftB numBinaryOps[o], @.beh, h.beh)
    else
      reactive (fj.liftB numBinaryOps[o], @.beh, r)
  handler.right = (o, l) ->
    reactive (fj.liftB numBinaryOps[o], l, @.beh)

  p = Proxy.create handler, null, reactiveSecret

  p.set = (n) ->
    h = Proxy.unProxy reactiveSecret, this
    h.beh.sendBehavior n
  p.curr = ->
    h = Proxy.unProxy reactiveSecret, this
    h.beh.valueNow()
  p.if = (tru, fls) ->
    h = Proxy.unProxy reactiveSecret, this
    reactive h.beh.ifB tru, fls
  p.change = (fn) ->
    handler.beh.changes().mapE fn 
    undefined

  p
reactive = reactive.use "self"

stream = (e) ->
  throw "not implemented yet" if not (e instanceof fj.EventStream)
  
  handler = merge makeIdHandler(),
    evt: e
  
  p = Proxy.create handler, null, streamSecret

  p.snapshot = (val) ->
    rh = Proxy.unProxy reactiveSecret, val
    if rh
      stream (handler.evt.snapshotE rh.beh)
    else
      throw "${val} must be a reactive"

  p.startsWith = (init) -> reactive handler.evt.startsWith init
  p


root.reactive :: (Any) -> Reactive
root.reactive = reactive

root.reactiveTimer = (interval) -> reactive (fj.timerB interval)

root.$E = (el, evt) -> stream (fj.extractEventE el, evt)

# wraping the jquery object to do reactive stuff
root.dom = (sel) ->
  jq = jQuery sel

  text: (value) ->
    jq.text value.curr()
    value.change (v) -> jq.text v

root.insertValue = (value, dest, field) ->
  rh = Proxy.unProxy reactiveSecret, value
  sh = Proxy.unProxy streamSecret, value
  if rh
    fj.insertValueB rh.beh, dest, field
  else if sh
    fj.insertValueE sh.evt, dest, field
  else
    throw "not implemented"
