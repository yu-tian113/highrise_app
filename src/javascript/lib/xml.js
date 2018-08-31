
/**
 * Get a node's textContent value if the node exists
 * @param {Node} container
 * @param {String} selector html selector
 * @return {String} node.textContent or undefined if node does not exist
 */
export function xmlExtract (container, selector) {
  const node = container.querySelector(selector)
  return node && node.textContent
}

/**
 * Extract fields' values from a list of nodes
 * @param {Node} container
 * @param {String} selector html selector
 * @param {Array} fields
 * @return {Array} array of maps which contain the fields' values of each node
 *
 * <contact><phone>phone1</phone><address>address1</address></contact>
 * <contact><phone>phone2</phone><address>address2</address></contact>
 *
 * => _extracInfo(nodeList, ['phone', 'address'])
 *
 * => [
 *      {phone: 'phone1', address: 'address1'}
 *      {phone: 'phone2', address: 'address3'}
 *    ]
 */
export function xmlExtractAll (container, selector, fields) {
  const nodeList = container.querySelectorAll(selector)
  return Array.prototype.map.call(nodeList, (item) => {
    return fields.reduce((accum, field) => {
      accum[field] = xmlExtract(item, field)
      return accum
    }, {})
  })
}
