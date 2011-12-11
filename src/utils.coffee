root = exports ? this["utils"] = {}

# merges values from b onto a and returns a
root.merge = (a, b) -> 
  a[key] = val for own key, val of b
  a


root.numUnaryOps = 
  '!': (x) -> !x
  '-': (x) -> -x

root.numBinaryOps =
  '+': (x, y) -> x + y
  '-': (x, y) -> x - y
  '*': (x, y) -> x * y
  '/': (x, y) -> x / y
  '===': (x, y) -> x is y
  '!==': (x, y) -> x isnt y

getPropertyDescriptor = (obj, prop) ->
  o = obj
  while o isnt null
    desc = Object.getOwnPropertyDescriptor o, prop
    if desc isnt undefined
      return desc
    o = Object.getPrototypeOf o
  undefined

root.makeIdHandler = (obj = {}) ->
  getOwnPropertyDescriptor: (name) ->
    desc = Object.getOwnPropertyDescriptor obj, name
    desc.configurable = true if desc isnt undefined
    desc

  getPropertyDescriptor: (name) ->
      desc = getPropertyDescriptor obj, name
      desc.configurable = true if desc
      desc

  getOwnPropertyNames: -> Object.getOwnPropertyNames obj

  getPropertyNames: -> Object.getPropertyNames obj

  defineProperty: (name, desc) -> Object.defineProperty obj, name, desc

  delete: (name) -> delete obj[name]

  fix: ->
    if Object.isFrozen obj
      Object.getOwnPropertyNames(obj).map (name) ->
        Object.getOwnPropertyDescriptor obj, name
    else
      undefined

  has: (name) -> name in obj

  hasOwn: (name) -> Object.prototype.hasOwnProperty.call obj, name

  enumerate: ->
    (name for name in obj)

  get: (receiver, name) -> obj[name]

  set: (receiver, name, val) ->
    obj[name] = val
    true

  keys: -> Object.keys obj
