assert = require 'assert'

require('../../lib/loadVirt').patch()
require '../../lib/loadContracts'

{i} = require '../../lib/complex'
{makeUnit} = require '../../lib//units'
{values, bind} = require '../../lib/multiple-values'
{defgeneric, defmethod} = require '../../lib/generic-functions'
{deffun} = require '../../lib/function-operators'
{list, head, tail, split} = require '../../lib/list'
{reactive, getCurrent, addListener, reactiveAlt} = require '../../lib/functional-reactive'
{infoReactive, HIGH, LOW, outputLow, outputHigh} = require '../../lib/info-reactive'

# note, don't use built in equality testing functions (eq, equals, etc.) since
# these will not be trapped (Cakefile can't be run through the virtualization process
# and the node builtins as well). Do the normal tests and then ok the resulting bool.
ok = assert


# simple identity proxy on numbers
makeVNum = (n) ->
  unaryOps =
    '-': (v) -> -v
  binaryOps =
    '+': (a, b) -> a + b
    '-': (a, b) -> a - b
    '/': (a, b) -> a / b
    '*': (a, b) -> a * b

  h = 
    value: n
    unary: (op) -> unaryOps[op] @.value
    left: (op, right) -> binaryOps[op] @.value, right
    right: (op, left) -> binaryOps[op] left, @.value
    get: (myprox, name) ->
      throw "Not defined"
  Proxy.create h, null, {}
        
# simple identity proxy on booleans
makeVBool = (b) ->
  h =
    value: b
    test: -> @.value
    get: (myproxy, name) ->
      throw "Not defined"

  Proxy.create h, null, {}

describe "Virtual Number", ->
  it "should behave like primitive numbers", ->
    p = makeVNum 10
    q = makeVNum 20

    # unary operations
    ok (-p) is -10    

    # binary left operations
    ok (p - 2) is 8
    ok (p + 2) is 12
    ok (p / 2) is 5
    ok (p * 2) is 20

    # binary right operations
    ok (20 + p) is 30
    ok (20 - p) is 10
    ok (20 / p) is 2
    ok (20 * p) is 200

    # binary operations, both proxy
    ok (q + p) is 30    
    ok (q - p) is 10    
    ok (q / p) is 2    
    ok (q * p) is 200    

describe "Virtual Boolean", ->
  it "should work for conditional statements", ->
    bt = makeVBool true
    bf = makeVBool false


    if bt
      ok yes
    else
      assert "should not reach this branch"
    
    if bf
      assert.fail "should not reach this branch"
    else
      ok yes

    if bt then ok yes else assert.fail "should not reach this branch"
    if bf then assert.fail "should not reach this branch" else ok yes

    

describe "Complex Numbers", ->
  it "should work with the basic operations", ->
    x = 4 + 1 * i
    y = 3 + 1 * i
    z = 7 + 2 * i

    ok (x + y) is z

describe "Multiple Values", ->
  it "should work with base values", ->
    v = values 2,3
    [x, y] = bind v

    ok v is 2
    ok x is 2
    ok y is 3

  it "should work with functions", ->
    polar = (x, y) ->
      values (Math.sqrt (x * x) + (y * y)), (Math.atan2 y, x)
    
    ok (polar 3.0, 4.0) is 5.0
    [r, theta] = bind (polar 3.0, 4.0)
    ok r is 5.0
    ok theta is 0.9272952180016122

describe "Generic functions", ->
  it "should work with basic usage", ->
    keyInput = do defgeneric
    defmethod keyInput, ((keyName) -> keyName is "escape"), (keyName) ->
      "quit!"
    defmethod keyInput, ((keyName) -> keyName is "enter"), (keyName) ->
      "do it!"  

    ok (keyInput "escape") is "quit!"
    ok (keyInput "enter") is "do it!"

describe "Funciton operators", ->
  it "should work for composition", ->
    f = deffun (x) -> x * x
    g = deffun (x) -> x + 10

    ok ((f + g) 10) is 400
    ok ((g + f) 10) is 110

  it "should work for currying", ->
    curried = deffun (x,y,z) -> x + y + z
    c1 = curried 1
    c2 = c1 2
    c3 = c2 3

    ok c3 is 6

describe "Lists", ->
 it "should behave like immutable lists", ->
    a = list [1,2,3]
    b = list [4,5,6]

    ok (a + b) is (list [1,2,3,4,5,6])

    h = head a
    t = tail a
    ok h is 1
    ok t is (list [2,3])

    [hd, tl] = split a
    ok hd is 1
    ok tl is (list [2,3])

    c = 1 >> b
    ok c is (list [1,4,5,6])

describe "FRP", ->
  it "should work with the standard impl", ->
    x = reactive 3

    a = x + 3
    b = x + a

    a is 6
    b is 9
    x.set 1
    a is 4
    b is 5

  it "should work with the alternative implementation", ->
    [x, set] = reactiveAlt()

    a = x + 4
    set 4
    a is 8

describe "FRP info flow", ->
  it "should work like I want", ->
    h = infoReactive 5, HIGH

    x = h + 5
    ok (outputLow x) is undefined
    ok (outputHigh x) is 10
    h.set 10
    ok (outputLow x) is undefined
    ok (outputHigh x) is 15

    l = infoReactive 10, LOW
    y = l + 5
    l.set (infoReactive 15, HIGH)
    ok (outputLow y) is 15
    ok (outputHigh y) is 20

    # y = false
    # if h
    #   y = infoReactive true, HIGH
    # ok (outputLow y is false)
    # ok (outputHigh y is true)

describe "Units", ->
  it "should work for basic units", ->
    meter = makeUnit 'meter'
    second = makeUnit 'second'
    g = 9.81 * meter / second / second
    assert.throws (-> g + 1)
