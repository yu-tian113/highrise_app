/* eslint-env jest */
import {resizeContainer, templatingLoop, loopingPaginatedRequest, render, escapeSpecialChars as escape, buildCache} from '../src/javascript/lib/helpers'
import createRangePolyfill from './polyfills/createRange'

if (!document.createRange) {
  createRangePolyfill()
}

const client = {
  invoke: jest.fn(),
  request: jest.fn()
}
const dataSet = [1, 2, 3]
const getTemplate = item => `${item}-`

describe('resizeContainer', () => {
  it('client.invoke has been called', () => {
    resizeContainer(client)
    expect(client.invoke).toHaveBeenCalled()
  })
})

describe('templatingLoop', () => {
  it('generate html with data set and template function', () => {
    expect(templatingLoop(dataSet, getTemplate, '-')).toBe('-1-2-3-')
  })

  it('return empty string if data set and initial value is empty', () => {
    expect(templatingLoop([], getTemplate)).toBe('')
  })
})

describe('loopingPaginatedRequest', () => {
  it('should return 1 user', (done) => {
    client.request.mockReturnValueOnce(Promise.resolve({
      users: [{ name: 'TT' }],
      next_page: ''
    }))
    loopingPaginatedRequest(client, 'fakeUrl', 'users').then((results) => {
      expect(results.length).toBe(1)
      done()
    })
  })

  it('should return 10 user', (done) => {
    client.request.mockReturnValue(Promise.resolve({
      users: [{ name: 'TT' }],
      next_page: 'http://getusers.nextpage'
    }))
    loopingPaginatedRequest(client, 'fakeUrl', 'users', 10).then((results) => {
      expect(results.length).toBe(10)
      done()
    })
  })
})

describe('render', () => {
  it('should replace ', () => {
    document.body.innerHTML = '<div id="placeholder"></div>'
    expect(document.querySelectorAll('#placeholder').length).toBe(1)
    render('#placeholder', '<div id="app"></div>')
    expect(document.querySelectorAll('#placeholder').length).toBe(0)
    expect(document.querySelectorAll('#app').length).toBe(1)
  })
})

describe('escapeSpecialChars', () => {
  it('should throw error if the passed in argument type is not String', function () {
    expect(() => {
      escape(1)
    }).toThrow()
  })
  it('should escape open/close html tags', () => {
    expect(escape('<script></script>')).toBe('&lt;script&gt;&lt;/script&gt;')
  })
  it('should escape ampersand', () => {
    expect(escape('a && b')).toBe('a &amp;&amp; b')
  })
  it('should escape quotes and back tick', () => {
    expect(escape('"string" \'string\' `string`')).toBe('&quot;string&quot; &#x27;string&#x27; &#x60;string&#x60;')
  })
  it('should escape equal sign', () => {
    expect(escape('a = b')).toBe('a &#x3D; b')
  })
  it('should escape unsafe tags and characters', () => {
    expect(escape('Test Ticket for Text App</a><script>javascript:alret(1);</script>')).toBe('Test Ticket for Text App&lt;/a&gt;&lt;script&gt;javascript:alret(1);&lt;/script&gt;')
  })
})

describe('buildCache', () => {
  let DOMFinder
  let spyQuerySelector

  beforeEach(() => {
    document.body.innerHTML = "<h1>Hellos</h1/><br /><p class='original'>Original</p>"
    spyQuerySelector = jest.spyOn(document, 'querySelector')
    DOMFinder = buildCache(document.querySelector.bind(document))
  })

  describe('get', () => {
    it('should cache and return cached value when called', () => {
      DOMFinder.getCache('p')
      DOMFinder.getCache('p')
      DOMFinder.getCache('p')
      expect(spyQuerySelector).toHaveBeenCalledTimes(1)

      DOMFinder.getCache('h1')
      expect(spyQuerySelector).toHaveBeenCalledTimes(2)

      DOMFinder.getCache('p')
      DOMFinder.getCache('h1')
      expect(spyQuerySelector).toHaveBeenCalledTimes(2)
    })

    it('should return cache, even after it has been replaced', () => {
      expect(DOMFinder.getCache('p').classList.contains('original')).toBe(true)

      render('p', "<p class='replaced'>Replaced</p>")

      expect(DOMFinder.getCache('p').classList.contains('original')).toBe(true)
      expect(DOMFinder.getCache('p').classList.contains('replaced')).toBe(false)
    })
  })

  describe('fetch', () => {
    it('should fetch element on every call', () => {
      DOMFinder.getLive('p')
      DOMFinder.getLive('p')
      DOMFinder.getLive('p')
      expect(spyQuerySelector).toHaveBeenCalledTimes(3)

      DOMFinder.getLive('h1')
      expect(spyQuerySelector).toHaveBeenCalledTimes(4)
    })

    it('should return a new element on every call', () => {
      expect(DOMFinder.getLive('p').classList.contains('original')).toBe(true)

      render('p', "<p class='replaced'>Replaced Lorem Ipsums!</p>")

      expect(DOMFinder.getLive('p').classList.contains('original')).toBe(false)
      expect(DOMFinder.getLive('p').classList.contains('replaced')).toBe(true)
    })
  })

  afterEach(() => {
    spyQuerySelector.mockRestore()
  })
})
