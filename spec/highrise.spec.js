/* eslint-env jest, browser */
import { default as Highrise, SELECTORS, DOMFinder } from '../src/javascript/modules/highrise'
import createRangePolyfill from './polyfills/createRange'
import {
  CLIENT,
  APPDATA,
  API_RES_NOTFOUND,
  API_RES_PERSON,
  API_RES_PEOPLE,
  API_RES_NOTE_ADDED
} from './mocks/mock'

jest.mock('../src/javascript/lib/i18n', () => {
  return {
    loadTranslations: () => {},
    t: key => key
  }
})

if (!document.createRange) {
  createRangePolyfill()
}

let app
const getBeforeEachCallback = (mockClientRequestReturnValue) => {
  return (done) => {
    document.body.innerHTML = '<section data-main><img class="loader" src="loader-green.gif"/></section>'
    DOMFinder.clear()
    CLIENT.request = jest.fn()
      .mockReturnValueOnce(mockClientRequestReturnValue)
    app = new Highrise(CLIENT, APPDATA, {})
    app._initializePromise.then(() => {
      done()
    })
  }
}

describe('Highrise App', () => {
  describe('Fail at loading requester details from Highrise API', () => {
    beforeEach(getBeforeEachCallback(Promise.reject(new Error('messge'))))

    it('should render error message when requester data is failed to load from Highrise', () => {
      const errorMsg = document.querySelector('.error .c-callout__title').textContent
      expect(errorMsg).toBe('auth.problem auth.error')
    })
  })

  describe('Requester is not found from Highrise API', () => {
    beforeEach(getBeforeEachCallback(Promise.resolve(API_RES_NOTFOUND)))

    it('should render add_contact link when current requester is not a contact in Highrise', () => {
      const link = document.querySelector('.add_contact')
      expect(link).not.toBeNull()
    })

    it('should compose the correct request data for adding a new contact in Highrise', () => {
      app._client.request = jest.fn()
        .mockReturnValue(Promise.resolve(API_RES_PERSON))
      document.querySelector('.add_contact').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      expect(app._client.request).toHaveBeenCalledWith(
        {
          url: 'https://zendesk.highrisehq.com/people.xml',
          dataType: 'text',
          data: `
<?xml version="1.0" encoding="UTF-8"?>
<person>
  <first-name>firstname</first-name>
  <last-name>middlename lastname</last-name>
  <company-name></company-name>
  <contact-data>
    <email-addresses>
      <email-address>
        <address>requester@email.com</address>
        <location>Work</location>
      </email-address>
    </email-addresses>
    <phone-numbers>
      <phone-number>
        <number></number>
        <location>Work</location>
      </phone-number>
    </phone-numbers>
  </contact-data>
</person>
`,
          type: 'POST',
          contentType: 'application/xml',
          headers: {
            'Authorization': `Basic YTFiMmMzOlg=`
          }
        }

      )
    })

    it('should reset error message if contact is created successfully', (done) => {
      app._client.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(API_RES_PERSON))
      app.loadRequesterDetails = jest.fn()
      app.resetError = jest.fn()
      app.addContact(new Event('click')).then(() => {
        expect(app.resetError).toHaveBeenCalled()
        done()
      })
    })

    it('should render error message if contact fail to create', (done) => {
      app._client.request = jest.fn()
        .mockReturnValueOnce(Promise.reject(new Error('')))
      app.renderError = jest.fn()
      app.addContact(new Event('click')).then(() => {
        expect(app.renderError).toHaveBeenCalledWith('contact.error')
        done()
      })
    })
  })

  describe('Requester is retrieved from Highrise API', () => {
    beforeEach(getBeforeEachCallback(Promise.resolve(API_RES_PERSON)))

    it('should retrieve and render requester details and add note form ', () => {
      const details = document.querySelector('.contact ul')
      const noteForm = document.querySelector('.contact form')
      expect(details).not.toBeNull()
      expect(noteForm).not.toBeNull()
      expect(app.requesterData).toEqual(
        {
          avatarURL: '/avatar.png',
          companyName: 'Sample Company',
          emails: [{address: 'customer@example.com'}],
          firstName: 'Sample',
          lastName: 'customer',
          im_accounts: [],
          personID: '313879991',
          phoneNumbers: [
            {
              number: '0412000000'
            }
          ],
          title: '',
          twitter_accounts: [
            {
              username: 'sampletwitter'
            }
          ],
          url: 'https://zendesk.highrisehq.com/people/313879991'
        }
      )
    })

    it('should render search results when search is complete successfully', () => {
      app._client.request = jest.fn().mockReturnValueOnce(Promise.resolve(API_RES_PEOPLE))
      app.search(new Event('submit')).then(() => {
        expect(document.querySelector(SELECTORS.appContainer).classList.contains('showResults')).toBe(true)
        expect(document.querySelector(SELECTORS.appContainer).querySelectorAll('.results li').length).toBe(2)
      })
    })

    it('should render error message when search is fail', (done) => {
      app._client.request = jest.fn()
        .mockReturnValueOnce(Promise.reject(new Error('')))
      app.search(new Event('submit')).then(() => {
        const errorMsg = document.querySelector('.error .c-callout__title').textContent
        expect(errorMsg).toBe('auth.problem auth.error')
        done()
      })
    })

    it('should hide results and go back to main stage', (done) => {
      app._client.request = jest.fn().mockReturnValueOnce(Promise.resolve(API_RES_PEOPLE))
      app.search(new Event('submit')).then(() => {
        document.querySelector('.back').dispatchEvent(new CustomEvent('click', {bubbles: true}))
        expect(document.querySelector(SELECTORS.appContainer).classList.contains('showResults')).toBe(false)
        done()
      })
    })

    it('should show note form when show_note_form link is clicked', () => {
      document.querySelector('.show_note_form').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      const $contactSection = document.querySelector('.contact')
      const $note = $contactSection.querySelector('textarea')
      expect($contactSection.classList.contains('showForm')).toBe(true)
      expect(document.activeElement).toBe($note)
    })

    it('should hide and reset note form when cancel button is clicked', () => {
      document.querySelector('.show_note_form').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      const $contactSection = document.querySelector('.contact')
      const $noteForm = $contactSection.querySelector('form')
      const $note = $noteForm.elements['note']
      $note.value = 'test note'
      // calling reset function as well as dispatch reset event to mimic real browser behaviour
      $noteForm.reset()
      $noteForm.dispatchEvent(new Event('reset'))
      expect($contactSection.classList.contains('showForm')).toBe(false)
      expect($note.value).toBe('')
    })

    it('should skip adding a note if note field is empty', (done) => {
      app._client.request = jest.fn()
      document.querySelector('.show_note_form').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      const $noteForm = document.querySelector('.contact form')
      const $note = $noteForm.elements['note']
      $note.value = ''
      app.addNote({
        preventDefault: () => {},
        target: $noteForm
      }).then(() => {
        expect(app._client.request).toHaveBeenCalledTimes(0)
        done()
      })
    })

    it('should compose the correct request data for adding a new note in Highrise', (done) => {
      app._client.request = jest.fn()
        .mockReturnValueOnce(Promise.resolve(null))
      document.querySelector('.show_note_form').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      const $noteForm = document.querySelector('.contact form')
      const $note = $noteForm.elements['note']
      $note.value = 'test note'
      app.addNote({
        preventDefault: () => {},
        target: $noteForm
      }).then(() => {
        expect(app._client.request).toHaveBeenCalledWith(
          {
            url: 'https://zendesk.highrisehq.com/notes.xml',
            dataType: 'text',
            data: `
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <body>note.body.message</body>
  <subject-id type="integer">313879991</subject-id>
  <subject-type>Party</subject-type>
</note>
`,
            type: 'POST',
            contentType: 'application/xml',
            headers: {
              'Authorization': `Basic YTFiMmMzOlg=`
            }
          }

        )
        done()
      })
    })

    it('should hide note form and show success message when note is added successfully', (done) => {
      app._client.request = jest.fn().mockReturnValue(Promise.resolve(API_RES_NOTE_ADDED))
      document.querySelector('.show_note_form').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      const $contactSection = document.querySelector('.contact')
      const $noteForm = $contactSection.querySelector('form')
      const $note = $noteForm.elements['note']
      $note.value = 'test note'
      app.addNote({
        preventDefault: () => {},
        target: $noteForm
      }).then(() => {
        expect($contactSection.classList.contains('showAdded')).toBe(true)
        expect($note.value).toBe('')
        done()
      })
    })

    it('should render error message and keep the note form data if note fails to be add', (done) => {
      app._client.request = jest.fn().mockReturnValueOnce(Promise.reject(new Error('')))
      document.querySelector('.show_note_form').dispatchEvent(new CustomEvent('click', {bubbles: true}))
      const $contactSection = document.querySelector('.contact')
      const $noteForm = $contactSection.querySelector('form')
      const $note = $noteForm.elements['note']
      $note.value = 'test note'
      app.addNote({
        preventDefault: () => {},
        target: $noteForm
      }).then(() => {
        const errorMsg = document.querySelector('.error .c-callout__title').textContent
        expect(errorMsg).toBe('contact.error')
        expect($contactSection.classList.contains('showForm')).toBe(true)
        expect($note.value).toBe('test note')
        done()
      })
    })
  })
})
