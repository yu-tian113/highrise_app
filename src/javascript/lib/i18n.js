import manifest from '../../manifest.json'

const defaultLocale = manifest.defaultLocale || 'en'

let translations

/**
 * Replace {{placeholder}} text in the translation string with context values:
 * "search.results": "{{count}} results"
 * I18n.t('search.results', { count: 10 })
 * @param {String} str translation string
 * @param {Object} context map of placeholder/value pairs to replace
 * @return {String} translation string
 */
function curlyFormat (str, context) {
  const regex = /{{(.*?)}}/g
  const matches = []
  let match

  do {
    match = regex.exec(str)
    if (match) {
      matches.push(match)
    }
  } while (match)

  return matches.reduce(function (str, match) {
    const newRegex = new RegExp(match[0], 'g')
    str = str.replace(newRegex, context[match[1]])
    return str
  }, str)
}

const I18n = {
  /**
   * Load translations for the specified locale
   * NOTE: This is where all language files are imported (and parsed by translation-loader) during webpack bundling,
   * @param {String} locale
   * @return {Object} translation object
   */
  tryRequire: function (locale) {
    try {
      return require(`../../translations/${locale}.json`)
    } catch (e) {
      return null
    }
  },

  /**
   * Retrieve translation of the passed in string
   * @param {String} key string to be translated
   * @param {Object} context map of placeholder/value pairs to replace in the translation string
   * @return {String} translation string
   */
  t: function (key, context) {
    if (!translations) {
      throw new Error('Translations must be initialized with I18n.loadTranslations before calling `t`.')
    }
    const keyType = typeof key
    if (keyType !== 'string') {
      throw new Error(`Translation key must be a string, got: ${keyType}`)
    }
    const template = translations[key]
    if (!template) {
      throw new Error(`Missing translation: ${key}`)
    }
    if (typeof template !== 'string') {
      throw new Error(`Invalid translation for key: ${key}`)
    }
    const html = curlyFormat(template, context)
    return html
  },

  /**
   * Initialize module with specified locale info
   * @param {String} locale
   * @return {Object} translation object
   */
  loadTranslations: function (locale) {
    translations = I18n.tryRequire(locale) ||
      I18n.tryRequire(locale.replace(/-.+$/, '')) || // e.g. fallback `en-US` to `en`
      I18n.tryRequire(defaultLocale) ||
      {}
    return translations
  }
}

I18n.loadTranslations(defaultLocale)

export default I18n
