/* eslint-env jest */
import I18n from '../src/javascript/lib/i18n'

jest.mock('../src/manifest.json', () => {
  return {
    isMock: true
  }
})
const mocktranslationObject = {
  'one': 'the first translation',
  'two.one': 'the second for: {{name}}',
  'two.two': 'the second for: {{name}}-{{other}}',
  'three.one.one': 'the {{name}} for {{name}} should be {{name}}',
  'object': {}
}
jest.mock('../src/translations/en.json', () => {
  return mocktranslationObject
})

const t = I18n.t
let mockTryRequire

describe('I18n', () => {
  describe('I18n initialization', () => {
    it('should throw error calling translate without initialization', function () {
      expect(() => {
        t('one')
      }).toThrow()
    })
    it('loadTranslations return en translations', function () {
      expect(I18n.loadTranslations('en')).toBe(mocktranslationObject)
    })
    it('loadTranslations fallback to en', function () {
      expect(I18n.loadTranslations('FAIL')).toBe(mocktranslationObject)
    })
    it('loadTranslations fail, return empty object', function () {
      mockTryRequire = jest.spyOn(I18n, 'tryRequire').mockImplementation(locale => null)
      expect(I18n.loadTranslations('FAIL')).toEqual({})
    })
  })
  describe('#t', function () {
    beforeAll(function () {
      mockTryRequire.mockRestore()
      I18n.loadTranslations('en')
    })

    it('returns a string', function () {
      expect(t('one')).toBe('the first translation')
    })

    it('interpolates one string', function () {
      expect(t('two.one', { name: 'Name' })).toBe('the second for: Name')
    })

    it('interpolates multiple strings', function () {
      expect(t('two.two', { name: 'Name', other: 'Other' })).toBe('the second for: Name-Other')
    })

    it('interpolates duplicates strings', function () {
      expect(t('three.one.one', { name: 'Name' })).toBe('the Name for Name should be Name')
    })

    it('should throw error if translate keyword is not string', function () {
      expect(() => {
        t({})
      }).toThrow()
    })

    it('should throw error if translate keyword is missing in the language file', function () {
      expect(() => {
        t('four')
      }).toThrow()
    })

    it('should throw error if translation is not a string', function () {
      expect(() => {
        t('object')
      }).toThrow()
    })
  })
})
