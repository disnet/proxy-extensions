secret = {}

unaryOps =
  '-': (x) -> -x
  '!': (x) -> !x
binOps =
  '+': (x, y) -> x + y
  '-': (x, y) -> x - y
  '*': (x, y) -> x * y
  '/': (x, y) -> x / y
  '&&': (x, y) -> x && y
  '||': (x, y) -> x || y
  '===': (x, y) -> x is y
  '!==': (x, y) -> x isnt y

exports.values = values = (vals...) ->
  h =
    vals: vals
    # all of the standard operations just
    # work on the first value
    unary: (o) -> unaryOps[o] @.vals[0]
    left: (o, right) ->
      h = Proxy.unProxy secret, right  
      if h
        binOps[o] @.vals[0], h.vals[0]
      else
        binOps[o] @.vals[0], right
    right: (o, left) ->
      binOps[o] left, @.vals[0]
    test: -> @.vals[0]
  Proxy.create h, null, secret

exports.bind = bind = (v) ->
  h = Proxy.unProxy secret, v
  if h
    h.vals
  else
    []