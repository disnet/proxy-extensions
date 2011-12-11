# unique value used to recognize other unit proxies
secret = {}

Quantity = ?!(x) -> if (typeof x is 'number' or Proxy.unProxy secret, x) then true else false

makeQuantity :: (Str, Num, Quantity) -> Quantity
makeQuantity = (u, i, n) ->
  h = Proxy.unProxy secret, n # see if the value passed in is also a unit proxy
  if i is 0                   # drop zero-ary unit
    n
  else if h and h.unit is u   # same unit, avoid duplicates
    makeQuantity u, (h.index + i), h.value
  else if h and h.unit > u    # keep proxies ordered
    makeQuantity h.unit, h.index, (makeQuantity u, i, h.value)
  else                        # add to the proxy chain
    Proxy.create {
      unit: u                 # record the unit, index, and underlying value in the handler
      index: i
      value: n
      unary: (o) -> unaryOps[o] u, i, n
      left: (o, r) -> leftOps[o] u, i, n, r
      right: (o, l) -> rightOps[o] u, i, n, l
      test: -> n    # ignore uints in tests
    }, null, secret
makeQuantity = makeQuantity.use "self"


unaryOps = 
  '-': (u, i, n) -> makeQuantity u, i, (-n)
  'typeof': (u, i, n) ->  typeof n

leftOps = 
  '+': (u, i, n, r) -> makeQuantity u, i, (n + (dropUnit u, i, r))
  '*': (u, i, n, r) -> makeQuantity u, i, (n * r)
  '/': (u, i, n, r) -> makeQuantity u, i, (n / r)
  '===': (u, i, n, r) -> n is (dropUnit u, i, r)

rightOps =
  # left argument is never a proxy
  '+': (u, i, n, l) -> throw "Unit mismatch"
  '*': (u, i, n, l) -> makeQuantity u, i, (l * n)
  '/': (u, i, n, l) -> makeQuantity u, (-i), (l / n)
  '=': (u, i, n, l) -> false

dropUnit :: (Str, Num, Quantity) -> Quantity
dropUnit = (u, i, n) ->
  h = Proxy.unProxy secret, n
  throw "bad units!" if not (h isnt false and h.unit is u and h.index is i)
  h.value
dropUnit = dropUnit.use "self"

# given a string to represent the unit will return a proxy
# that represents one of that unit
exports.makeUnit :: (Str) -> Quantity
exports.makeUnit = makeUnit = (u) -> makeQuantity u, 1, 1