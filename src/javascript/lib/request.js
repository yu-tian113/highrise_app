/**
 * Compose GET request options
 * @param {String} resource name of the highrise resource
 * @return {Object} options
 */
export function buildGETRequest (resource, token) {
  return {
    url: resource,
    dataType: 'text',
    headers: {
      'Authorization': `Basic ${token}`
    }
  }
}

/**
 * Compose POST request options
 * @param {String} data xml data in string format
 * @param {String} resource name of the highrise resource
 * @return {Object} options
 */
export function buildPOSTRequest (resource, data, token) {
  return {
    url: resource,
    dataType: 'text',
    data: data,
    type: 'POST',
    contentType: 'application/xml',
    headers: {
      'Authorization': `Basic ${token}`
    }
  }
}
