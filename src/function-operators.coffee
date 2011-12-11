secret = {}

df = (f, fakeArity, partialArgs = []) ->
  h =
    partialArgs: partialArgs
    f: f
    get: (r, name) -> 
      if name is 'length' and fakeArity?
        fakeArity
      else
        f[name]
    left: (o, r) ->
      if o is '+'
        df ((args...) -> f (r.apply @, args)), r.length

  call = (args...) ->
    flen = if fakeArity? then fakeArity else f.length
    if (args.length + h.partialArgs.length) < flen
      df f, null, h.partialArgs.concat args
    else if (args.length + h.partialArgs.length) > flen
      # todo: don't throw, just defer to arguments?
      throw "Too many arguments: supplied #{args.length + h.partialArgs.length} but was expecting #{f.length}"
    else
      f.apply @, h.partialArgs.concat args

  Proxy.createFunction h, call, call

exports.deffun = (f) -> 
  df f, null