/* eslint-env jest */
import {resizeContainer, templatingLoop, loopingPaginatedRequest, render, escapeSpecialChars as escape} from '../src/javascript/lib/helpers'
import createRangePolyfill from './polyfills/createRange'

if (!document.createRange) {
  createRangePolyfill()
}

const client = { invoke: jest.fn() }
const dataSet = [1, 2, 3]
const getTemplate = item => `${item}-`

describe('resizeContainer', () => {
  resizeContainer(client)
  it('client.invoke has been called', () => {
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
  let client = {
    request: jest.fn()
  }

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

describe('defer', () => {
  it('should defer the function execution while all arguments still passed through, including context', (done) => {
    const mockContext = {name: 'mock'}
    const mockFn = jest.fn().mockImplementation(function (...args) {
      return this.name + args.join('')
    })
    const deferredFn = defer(mockFn, 100)
    const deferredFnReturn = deferredFn.call(mockContext, 1, 2, 3)
    deferredFnReturn.then((val) => {
      expect(val).toEqual('mock123')
      done()
    })
  })
})