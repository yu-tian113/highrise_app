/**
 * Resize App container
 * @param {ZAFClient} client ZAFClient object
 * @param {Number} max max height available to resize to
 * @return {Promise} will resolved after resize
 */
export function resizeContainer (client, max = Number.POSITIVE_INFINITY) {
  const newHeight = Math.min(document.body.clientHeight, max)
  return client.invoke('resize', { height: newHeight })
}

/**
 * Helper to render a dataset using the same template function
 * @param {Array} set dataset
 * @param {Function} getTemplate function to generate template
 * @param {String} initialValue any template string prepended
 * @return {String} final template
 */
export function templatingLoop (set, getTemplate, initialValue = '') {
  return set.reduce((accumulator, item, index) => {
    return `${accumulator}${getTemplate(item, index)}`
  }, initialValue)
}

/**
 * Helper to get all the results from a paginated API request
 * @param {ZAFClient} client ZAFClient object
 * @param {String} url API endpoint
 * @param {String} entityName the entity you want to get from the response, e.g. User api response is like {users:[]}
 * @param {Number} max limit of the max number of requests can be made
 * @param {Number} loadedPageCount counter that count the number of requests have been made
 * @return {Array} array of results, e.g. user records
 */
export async function loopingPaginatedRequest (client, url, entityName, max = Number.POSITIVE_INFINITY, loadedPageCount = 0) {
  let results = []
  if (loadedPageCount < max) {
    loadedPageCount++
    let res = await client.request({
      url: url,
      cors: true
    })
    Array.isArray(res[entityName]) && results.push(...res[entityName])
    if (res.next_page) {
      results.push(...(await loopingPaginatedRequest(client, res.next_page, entityName, max, loadedPageCount)))
    }
  }
  return results
}

/**
 * Render template
 * @param {String} replacedNodeSelector selector of the node to be replaced
 * @param {String} htmlString new html string to be rendered
 */
export function render (replacedNodeSelector, htmlString) {
  const fragment = document.createRange().createContextualFragment(htmlString)
  const replacedNode = document.querySelector(replacedNodeSelector)
  replacedNode.parentNode.replaceChild(fragment, replacedNode)
}

/**
 * Helper to escape unsafe characters in HTML, including &, <, >, ", ', `, =
 * @param {String} str String to be escaped
 * @return {String} escaped string
 */
export function escapeSpecialChars (str) {
  if (typeof str !== 'string') throw new TypeError('escapeSpecialChars function expects input in type String')
  const escape = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return str.replace(/[&<>"'`=]/g, function (m) { return escape[m] })
}

/**
 * Build function to retrieve value from cache or live
 * @param {Object} cache cache data storage
 * @param {Function} fetchFunc function to retrieve the live data from a key
 * @param {Boolean} purgeCache flag to indicate whether to update cached data with live data
 * @return {Function}
 */
function buildCacheFinder (cache, fetchFunc, purgeCache = false) {
  return (key) => {
    if (purgeCache || !cache.has(key)) {
      cache.set(key, fetchFunc(key))
    }

    return cache.get(key)
  }
}

/**
 * Build a cache util instance
 * @param {Function} fetchFunc function to retrieve the live data from a key
 * @return {Object} a cache instance
 * getLive force to request live data every time
 * getCache request cache if key exists
 * clear remove all cache storage
 */
export function buildCache (fetchFunc) {
  let cache = new Map()

  return {
    getCache: buildCacheFinder(cache, fetchFunc),
    getLive: buildCacheFinder(cache, fetchFunc, true),
    clear: () => {
      cache.clear()
    }
  }
}

/**
 * Helper function to bind DOM events and handlers to Nodes
 * @param {Object} context context to be bound to the handler functions
 * @param {Array} eventsList aggregated array of events,
 * each event is an array composed of [target, eventName, handler]
 */
export function bindDOMEvents (context, ...eventsList) {
  eventsList.forEach((event) => {
    const [target, name, handler] = event
    target.addEventListener(name, handler.bind(context))
  })
}

/**
 * Helper function to bind ZAF events and handlers
 * @param {Object} client ZAFClient instance
 * @param {Object} context context to be bind to the handler functions
 * @param {Array} eventsList aggregated array of events,
 * each event is an array composed of [eventName, handler]
 */
export function bindZAFEvents (client, context, ...eventsList) {
  eventsList.forEach((event) => {
    const [name, handler] = event
    client.on(name, handler.bind(context))
  })
}
