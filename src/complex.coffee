# unique value used to recognize other unit proxies
secret = {}

unaryOps =
  '-': (r, i) -> makeComplex -r, -i
  'typeof': (r, i) -> 'number'

binOps =
  '+': (r1, i1, r2, i2) -> makeComplex (r1 + r2), (i1 + i2)
  '*': (r1, i1, r2, i2) -> makeComplex (r1 * r2 - i1 * i2), (i1 * r2 + r1 * i2)
  '===': (r1, i1, r2, i2) -> (r1 is r2) and (i1 is i2)

Complex = ?!(x) -> isComplex x

makeComplex :: (Num, Num) -> Complex
makeComplex = (r, i) ->
  h =
    real: r   # store the real and imaginary parts in the handler
    imag: i
    unary: (o) -> unaryOps[o] r, i
    left: (o, right) ->
      # see if the right value is also a complex number
      h = Proxy.unProxy secret, right  
      if h
        # right is a complex number so pull out its real and imaginary parts
        binOps[o] r, i, h.real, h.imag
      else
        # right is not a complex number so pass 0 as the imaginary part
        binOps[o] r, i, y, 0
    right: (o, left) ->
      # left is never a complex number
      binOps[o] left, 0, r, i
    # all complex numbers are non-false
    test: -> true     
    getPropertyDescriptor: (name) -> undefined
  Proxy.create h, null, secret
exports.makeComplex = makeComplex
makeComplex = makeComplex.use "self"

exports.isComplex :: (Any) -> Bool
exports.isComplex = isComplex = (x) -> if (Proxy.unProxy secret, x) then true else false

# Complex
exports.i = makeComplex 0, 1