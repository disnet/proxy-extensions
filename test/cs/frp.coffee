assert = require 'assert'
require('../../lib/loadVirt').patch()
require '../../lib/loadContracts'

fj = require "../../lib/flapjax"
frp = require "../../lib/frp"

# note, don't use built in equality testing functions (eq, equals, etc.) since
# these will not be trapped (Cakefile can't be run through the virtualization process
# and the node builtins as well). Do the normal tests and then ok the resulting bool.
ok = assert

id = (x) -> x

describe 'flapjax', ->

  it "works with the basic usage of core flapjax", ->
    # n = fj.createNode [], id
    # console.log n
    nowB = fj.timerB 1000
    time = nowB.valueNow()
    console.log time
    fj.disableTimer nowB
 
  it "works with virtual values for basic numbers and bools", ->
    x = frp.reactive 5
    react_bool = frp.reactive true
    y = x + 5
    a = 5 + x
    z = x + y
    min = -x

    isfive = x is 5
    ok x.curr() is 5
    ok y.curr() is 10
    ok a.curr() is 10
    ok z.curr() is 15
    ok min.curr() is -5
    ok isfive.curr() is true
    x.set 10
    ok x.curr() is 10    
    ok y.curr() is 15    
    ok a.curr() is 15    
    ok z.curr() is 25    
    ok min.curr() is -10     
    ok isfive.curr() is false    

    it "works with virtual values for conditionals", ->
      x = frp.reactive 5

      # if x is 5
      #   res = true
      # else
      #   res = false

      res = (x is 5).if true, false
      
      ok res.curr() is true    
      x.set 10
      ok res.curr() is false    

