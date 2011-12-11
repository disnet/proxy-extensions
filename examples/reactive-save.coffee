makeRequest = (v) ->
  url: "/saveValue"
  fields: value: v
  request: "post"

sendToServer = (v) ->
  console.log "Sending: #{v.fields.value}"

setupSavebox = (saveWhen) ->
  requests = saveWhen.snapshotE($B("edit")).mapE makeRequest
  requests.mapE sendToServer

window.run = ->
  setupSavebox (timerE 10000).mergeE $E "btnSave", "click"
