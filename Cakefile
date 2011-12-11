require 'fs'
{spawn, exec} = require 'child_process'

run = (args, cb) ->
  proc =         spawn 'coffee', args
  proc.stderr.on 'data', (buffer) -> console.log buffer.toString()
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'

buildSrc = (cb) -> run ['-c', '-C', '-V', '-o', 'lib', 'src'], cb
buildExamples = (cb) -> run ['-c', '-C', '-V', 'examples'], cb

task 'build', 'builds the proxy extensions', (cb) ->
  buildSrc buildExamples

task 'test', 'run the tests', ->
  buildSrc ->
    run ['-c', '-C', '-V', '-o', 'test/js', 'test/cs'], ->
      exec 'node --harmony_proxies --harmony-weakmaps /usr/local/bin/mocha test/js/*.js', (err, stdout) -> 
        if err?
          console.log stdout.toString()
          console.log err.toString()
        else
          console.log stdout?.toString()
