{makeIdHandler, merge, numUnaryOps, numBinaryOps} = utils

reactiveSecret = {}
streamSecret = {}

root = global ? this

# wrap a flapjax value in a virtual value
wrap = (x) ->
  if x instanceof Behavior 
    reactive x
  else if x instanceof EventStream
    stream x
  else if typeof x is 'function'
    (args...) => wrap x.apply @, (unwrap arg for arg in args)
  else 
    x 

# unwrap a virtual value into flapjax value
unwrap = (x) ->
  rh = Proxy.unProxy reactiveSecret, x
  sh = Proxy.unProxy streamSecret, x
  if rh then rh.beh else if sh then sh.evt else x

reactive = (x) -> 
  b = if x instanceof Behavior then x else startsWith receiverE(), x

  handler = merge (makeIdHandler b),
    beh: b
    # need to wrap.bind to make sure this is pointing to the behavior not the reactive
    get: (r, name) -> (wrap.bind handler.beh) handler.beh[name]
    unary: (o) -> reactive (liftB numUnaryOps[o], @.beh)
    left: (o, r) ->
      h = Proxy.unProxy reactiveSecret, r
      if h
        reactive (liftB numBinaryOps[o], @.beh, h.beh)
      else
        reactive (liftB numBinaryOps[o], @.beh, r)
    right: (o, l) -> reactive (liftB numBinaryOps[o], l, @.beh)

  Proxy.create handler, null, reactiveSecret

stream = (e) ->
  throw "streams must be built from EventStreams" if not (e instanceof EventStream)
  
  handler = merge (makeIdHandler e),
    evt: e
    # need to wrap.bind to make sure `this` is pointing to the evtStream not the stream
    get: (r, name) -> (wrap.bind handler.evt) handler.evt[name]
  
  Proxy.create handler, null, streamSecret

# need to wrap some specific flapjax functions that 
# are called directly (ie not as methods on reactive or stream)
root.timerB = wrap timerB
root.timerE = wrap timerE
root.insertValueB = wrap insertValueB
root.$E = wrap $E
root.$B = wrap $B
