{makeIdHandler, merge} = require './utils'
secret = {}
STOP = {}

# using numbers to represent the array index
# we are holding the value 
# TODO: encapsulate this better
exports.HIGH = HIGH = 1
exports.LOW = LOW = 0

Label = ?!(x) -> x is HIGH or x is LOW

join :: (Label, Label) -> Label
join = (a, b) -> if a is HIGH or b is HIGH then HIGH else LOW
join = join.use "self"

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

getValue :: ([Num, Num], Label) -> Num
getValue = (v, label) ->
  # if there is no value at this security level get the lower one
  if v[label] is undefined
    v[LOW]
  else
    v[label]
getValue = getValue.use "self"


# quasi-flapjax style FR with information flow
makeReactive :: (Null or [...Reactive], (Any) -> Any or StopVal, Any?, Label?) -> Reactive
makeReactive = (source, update, value = null, label = LOW) ->
  handler = merge makeIdHandler(),
    sinks: []
    # values are stored at security levels in an array: 0: low, 1: high
    value: [undefined, undefined]
    update: update
    label: label

  # consult pc for real label once test trap is working
  handler.value[label] = value

  handler.sources = if source? then source else []

  p = Proxy.create handler, null, secret
  handler.left = (o, r) ->
      src = p
      h = Proxy.unProxy secret, r
      if h
        upd = (t) -> 
          hand = Proxy.unProxy secret, t
          if hand
            binaryOps[o] (getValue hand.value, hand.label), (getValue h.value, h.label)
          else
            binaryOps[o] t, (getValue h.value, h.label)
        val = binaryOps[o] (getValue @.value, @.label), (getValue h.value, h.label)
        # consult pc for real label once test trap is working
        makeReactive [src], upd, val, (join @.label, h.label)
      else
        upd = (t) -> 
          hand = Proxy.unProxy secret, t
          if hand
            binaryOps[o] (getValue hand.value, hand.label), r
          else
            binaryOps[o] t, r
        val = binaryOps[o] (getValue @.value, @.label), r
        # consult pc for real label once test trap is working
        makeReactive [src], upd, val, @.label
  handler.right = (o, l) ->
    src = p
    upd = (t) -> binaryOps[o] l, t
    val = binaryOps[o] l, (getValue @.value, @.label)
    # consult pc for real label once test trap is working
    makeReactive [src], upd, val, @.label
  handler.test = (c) -> true
  # once we have the full conditional trap it should look something like this
  # handler.test = (c, t, e) ->
  #   h = Proxy.unProxy secret, c
  #   if h
  #     old_pc = pc
  #     # pc is a global that makeReactive and left/right traps consult 
  #     # when making new info flow reactive values
  #     pc = join h.label, pc
  #     if c
  #       t()
  #     else
  #       e()
  #     pc = old_pc
  #   else
  #     throw "shouldn't get here, since can only be in the test trap if c is our proxy"



  handler.sources.forEach (s) ->
    h = Proxy.unProxy secret, s
    if h
      h.sinks.push p
    else
      throw "Source is not a reactive value!"
  p.set = (x) ->
    h = Proxy.unProxy secret, x
    # label depends on the value we're being updated with
    if h
      l = join handler.label, h.label
    else
      l = handler.label

    upd = handler.update x
    if upd isnt STOP
      handler.value[l] = upd 
      s.set upd for s in handler.sinks
  p
makeReactive = makeReactive.use "self"

# simulates a low output channel by just returning the low value of its argument
exports.outputLow = (x) ->
  h = Proxy.unProxy secret, x
  if h
    h.value[LOW]  
  else
    x

# simulates a high output channel by just returning the high value of its argument
exports.outputHigh = (x) ->
  h = Proxy.unProxy secret, x
  if h
    if h.value[HIGH] isnt undefined
      h.value[HIGH]
    else
      h.value[LOW]
  else
    x

exports.infoReactive = (number, label) -> makeReactive null, id, number, label
