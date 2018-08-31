import Highrise from '../modules/highrise'

/* global ZAFClient */
const client = ZAFClient.init()

client.on('app.registered', function (appData) {
  return new Highrise(client, appData)
})
