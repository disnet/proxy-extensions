secret = {}

exports.defgeneric = defgeneric = -> 
  h = 
    paramPredicates: []
    test: -> true

  call = (args...) ->
    if h.paramPredicates.length is 0
      throw "no method specializations defined"

    check = (paramPredicates) ->
      if args.length isnt paramPredicates.length
        false
      else
        args.every (arg, index) ->
          paramPredicates[index]? and paramPredicates[index](arg)
    
    res = (predicate[1] for predicate in h.paramPredicates when check predicate[0])

    if res?.length isnt 1
      # todo: don't throw, some kind of ordering on predicates?
      throw "multiple specializations match"
    else
      res[0].apply @, args

  construct = -> 
    throw "not defined"

  Proxy.createFunction h, call, construct, secret

# rest is 0 or more param predicates followed by the body
exports.defmethod = defmethod = (f, rest...) -> 
  h = Proxy.unProxy secret, f
  if h
    if rest.length is 0
      throw "must define a body"
    else
      preds = rest[0...(rest.length - 1)]
      body = rest[rest.length - 1]
      h.paramPredicates.push [preds, body]
  else
    throw "not a generic function"
   