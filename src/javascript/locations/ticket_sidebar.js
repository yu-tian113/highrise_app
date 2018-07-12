import Hangouts from '../modules/hangouts'
// new ticket sidebar specific configs
const configs = {}
export default class extends Hangouts {
  constructor (client, data) {
    super(client, data, configs)
  }
}
