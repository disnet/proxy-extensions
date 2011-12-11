secret = {}

# note: contracts on arrays/objects don't play nice with WeakMaps
# so most of the contracts here are commented out.

print = console.log

# See http://wiki.ecmascript.org/doku.php?id=harmony:egal
egal = (a, b) ->
  if a is b
    a isnt 0 or 1/a is 1/b
  else
    a isnt a and b isnt b

# A recursive functional equivalence helper; uses egal for testing equivalence.
arrayEgal = (a, b) ->
  if egal a, b then yes
  else if a instanceof Array and b instanceof Array
    return no unless a.length is b.length
    return no for el, idx in a when not arrayEgal el, b[idx]
    yes

List = ?!(a) -> if (Proxy.unProxy secret, a) then true else false


# binOps ::
#   '+': ([...Any], [...Any]) -> List
#   '===': ([...Any], [...Any]) -> Bool
binOps =
  '+': (a, b) -> makeList a.concat b
  # cons, might not be the best operator in the world but...meh
  '>>': (h, t) -> makeList [h].concat t
  '===': (a, b) -> arrayEgal a, b
# binOps = binOps.use "self"

makeList = (a) ->
  Proxy.create
    array: a
    get: (r, name) -> @.array[name]
    set: (r, name, val) -> throw "Cannot set '#{name}' to '#{val}', List is immutable!"
    left: (o, right) -> 
      h = Proxy.unProxy secret, right
      if h
        binOps[o] @.array, h.array
      else
        binOps[o] @.array, right
    right: (o, left) ->
      binOps[o] left, @.array
   , null, secret


# exports.list :: ([...Any]) -> List
exports.list = makeList

exports.head :: (List) -> Any
exports.head = head = (l) -> 
  h = Proxy.unProxy secret, l
  if h
    h.array[0]
  else
    throw "Not a list"

exports.tail :: (List) -> List
exports.tail = tail = (l) -> 
  h = Proxy.unProxy secret, l
  if h
    makeList h.array[1...h.array.length]
  else
    throw "Not a List"

exports.split :: (List) -> [Any, List]
exports.split = split = (l) -> [(head l), (tail l)]
