import I18n from '../../javascript/lib/i18n'
import { resizeContainer, render, buildCache, bindDOMEvents, bindZAFEvents } from '../../javascript/lib/helpers'
import { buildGETRequest, buildPOSTRequest } from '../../javascript/lib/request'
import { xmlExtract, xmlExtractAll } from '../../javascript/lib/xml'
import closest from 'closest'
import getErrorTemplate from '../../templates/error'
import getMainTemplate from '../../templates/main'
import getContactTemplate from '../../templates/contact'
import getResultsTemplate from '../../templates/results'
import getLoaderTemplate from '../../templates/loader'
import getContactXMLTemplate from '../../templates/contact.xml'
import getNoteXMLTemplate from '../../templates/note.xml'

// DOMParser to parse xml response from highrise API
const DOMPARSER = new DOMParser()
export const DOMFinder = buildCache(document.querySelector.bind(document))
const MAX_HEIGHT = 1000
const END_POINTS = {
  EMAIL_LOOKUP: 'people/search.xml?criteria[email]=',
  NOTES: 'notes.xml',
  PEOPLE: 'people.xml',
  PEOPLE_LINK: 'people/',
  SEARCH: 'people/search.xml?term=',
  HIGHRISE: 'https://%@.highrisehq.com/'
}

// Export for test use
export const SELECTORS = {
  appContainer: '[data-main]',
  searchForm: '[data-main] .search form',
  results: '[data-main] .search .results',
  backFromResultsLink: '[data-main] .search .results .back',
  contactContainer: '[data-main] .contact',
  addContactLink: '[data-main] .contact .add_contact',
  noteForm: '[data-main] .contact form',
  noteField: '[data-main] .contact form textarea',
  showNoteFormLink: '[data-main] .contact .show_note_form',
  error: '[data-main] .error',
  loader: '.loader'
}

class Highrise {
  constructor (client, appData) {
    this._client = client
    this._settings = appData.metadata.settings

    this.bindDOMEvents = (...args) => bindDOMEvents(this, ...args)
    this.bindZAFEvents = (...args) => bindZAFEvents(this._client, this, ...args)
    this.resize = () => resizeContainer(this._client, MAX_HEIGHT)

    // this._initializePromise is used to indicate app initilization(including all async operations) is complete,
    // only used in integration testing
    this._initializePromise = this.init()
  }

  /**
   * Initialize module
   */
  async init () {
    const currentUser = (await this._client.get('currentUser'))['currentUser']
    I18n.loadTranslations(currentUser.locale)

    // render main template
    render(SELECTORS.loader, getMainTemplate())

    await this.loadRequesterDetails()
    this.registerEvents()

    return this.resize()
  }

  /**
   * Register both DOM and ZAF events
   */
  registerEvents () {
    const $appContainer = DOMFinder.getCache(SELECTORS.appContainer)
    const $searchForm = DOMFinder.getCache(SELECTORS.searchForm)
    this.bindDOMEvents(
      [$appContainer, 'click', this.clickHandlerDispatch],
      [$searchForm, 'submit', this.search]
    )

    this.bindZAFEvents(
      ['ticket.requester.email.changed', this.loadRequesterDetails]
    )
  }

  /**
   * Getter to return the highrise authenticate token
   * @return {String} authenticate token
   */
  get token () {
    // Password is not required as we are using authenticate token, but Highrise
    // uses HTTP Basic Authentication, it may assume that you want to have a password,
    // it's safer to pass in a dummy password, like X.
    // https://github.com/basecamp/highrise-api#authentication
    // Also we base64 encode it to use in HTTP Request Authorization header
    this._token = this._token || window.btoa(this._settings.token + ':X')
    return this._token
  }

  /**
   * Getter to return the highrise domain
   * @return {String} highrise domain
   */
  get domain () {
    this._domain = this._domain || END_POINTS.HIGHRISE.replace('%@', this._settings.subdomain)
    return this._domain
  }

  /**
   * Handling click events delegation
   * @param {Event} event
   */
  clickHandlerDispatch (event) {
    const target = event.target

    if (closest(target, SELECTORS.showNoteFormLink, true)) this.showNoteForm(event)
    else if (closest(target, SELECTORS.backFromResultsLink, true)) this.hideResults(event)
    else if (closest(target, SELECTORS.addContactLink, true)) this.addContact(event)
  }

  /**
   * Request and loading requester details from Highrise API,
   * This function is used for
   * 1. Loading requester details on app initialisation
   * 2. Loading requester details on requester email update
   * 3. Loading requester details after new highrise entry added
   */
  async loadRequesterDetails () {
    this.requester = (await this._client.get('ticket.requester'))['ticket.requester']

    /* istanbul ignore else */
    if (this.requester) {
      const options = buildGETRequest(
        this.domain + END_POINTS.EMAIL_LOOKUP + this.requester.email,
        this.token
      )

      await this._client.request(options)
        .then(this.loadRequesterDetailsSuccessHandler.bind(this))
        .catch(this.loadRequesterDetailsFailureHandler.bind(this))
    }
  }

  /**
   * Success handler for loadRequesterDetails request
   * Re-render contact section if response is not empty
   * @param {Object} response http response object
   * @return {Promise} resolved after resize complete
   */
  loadRequesterDetailsSuccessHandler (response) {
    this.resetError()

    const person = this.parsePersonData(response)

    if (person) {
      this.requesterData = person

      render(SELECTORS.contactContainer, getContactTemplate(person))

      const $noteForm = DOMFinder.getLive(SELECTORS.noteForm)
      this.bindDOMEvents(
        [$noteForm, 'reset', this.hideNoteForm],
        [$noteForm, 'submit', this.addNote]
      )
      DOMFinder.getLive(SELECTORS.contactContainer)
      DOMFinder.getLive(SELECTORS.noteField)
    } else {
      this.requesterData = undefined
      render(SELECTORS.contactContainer, getContactTemplate())
    }

    return this.resize()
  }

  /**
   * Failure handler for loadRequesterDetails request
   * Render error message
   * @return {Promise} resolved after renderError complete
   */
  loadRequesterDetailsFailureHandler () {
    return this.renderError(`${I18n.t('auth.problem')} ${I18n.t('auth.error')}`)
  }

  /**
   * Parse XML Person data to Object
   * @param {XML String} xml
   * @return {Object} a person data object
   */
  parsePersonData (xml) {
    const data = DOMPARSER.parseFromString(xml, 'application/xml')
    const person = data.querySelector('person')

    if (!person) return

    return {
      avatarURL: xmlExtract(person, 'avatar_url'),
      companyName: xmlExtract(person, 'company-name'),
      emails: xmlExtractAll(person, 'contact-data > email-addresses > email-address', ['address']),
      firstName: xmlExtract(person, 'first-name'),
      lastName: xmlExtract(person, 'last-name'),
      im_accounts: xmlExtractAll(person, 'contact-data > instant-messengers > instant-messenger', ['address', 'protocol']),
      personID: xmlExtract(person, 'id'),
      phoneNumbers: xmlExtractAll(person, 'contact-data > phone-numbers > phone-number', ['number']),
      title: xmlExtract(person, 'title'),
      twitter_accounts: xmlExtractAll(person, 'contact-data > twitter-accounts > twitter-account', ['username']),
      url: this.domain + END_POINTS.PEOPLE_LINK + xmlExtract(person, 'id')
    }
  }

  /**
   * Search through highrise API and display results/error
   * @param {Event} event form submit event trigger the search
   */
  async search (event) {
    event.preventDefault()

    const $searchForm = DOMFinder.getCache(SELECTORS.searchForm)

    const $searchButton = $searchForm.elements['submit']
    $searchButton.classList.add('is-loading')

    const searchTerm = $searchForm.elements['term'].value
    const options = buildGETRequest(
      this.domain + END_POINTS.SEARCH + searchTerm,
      this.token
    )

    await this._client.request(options)
      .then(this.searchSuccessHandler.bind(this))
      .catch(this.searchFailureHandler.bind(this))

    $searchButton.classList.remove('is-loading')
  }

  /**
   * Success handler for search request
   * Render results section
   * @param {Object} response http response object
   * @return {Promise} resolved after resize complete
   */
  searchSuccessHandler (response) {
    this.resetError()

    const data = DOMPARSER.parseFromString(response, 'application/xml')
    const persons = data.querySelectorAll('person')
    const resultsData = {
      total: persons.length,
      results: Array.prototype.map.call(persons, (person) => {
        return {
          name: `${xmlExtract(person, 'first-name')} ${xmlExtract(person, 'last-name')}`,
          url: this.domain + END_POINTS.PEOPLE_LINK + xmlExtract(person, 'id')
        }
      })
    }

    render(SELECTORS.results, getResultsTemplate(resultsData))

    const $appContainer = DOMFinder.getCache(SELECTORS.appContainer)
    $appContainer.classList.add('showResults')

    return this.resize()
  }

  /**
   * Failure handler for search request
   * Render error message
   * @return {Promise} resolved after renderError complete
   */
  searchFailureHandler () {
    return this.renderError(`${I18n.t('auth.problem')} ${I18n.t('auth.error')}`)
  }

  /**
   * Add a note through highrise API
   * @param {Event} event form submit event trigger the addNote
   */
  async addNote (event) {
    event.preventDefault()

    const $noteForm = event.target
    const $note = $noteForm.elements['note']

    if (!$note.value) return

    const $submit = $noteForm.elements['submit']
    $submit.disabled = true
    $submit.classList.add('is-loading')

    this.originalNoteMessage = $note.value
    const noteMessage = I18n.t(
      'note.body.message',
      {
        value: $note.value,
        ticketID: (await this._client.get('ticket.id'))['ticket.id']
      }
    )
    $note.value = noteMessage

    const data = getNoteXMLTemplate(
      {
        body: noteMessage,
        personID: this.requesterData.personID
      }
    )
    const options = buildPOSTRequest(
      this.domain + END_POINTS.NOTES,
      data,
      this.token
    )

    await this._client.request(options)
      .then(this.addNoteSuccessHandler.bind(this))
      .catch(this.addNoteFailureHandler.bind(this))

    $submit.disabled = false
    $submit.classList.remove('is-loading')
  }

  /**
   * Success handler for addNote request
   * @param {Object} response http response object
   * @return {Promise} resolved after resize complete
   */
  addNoteSuccessHandler () {
    this.resetError()

    const $contactContainer = DOMFinder.getCache(SELECTORS.contactContainer)
    $contactContainer.classList.add('showAdded')

    const $noteForm = DOMFinder.getCache(SELECTORS.noteForm)
    $noteForm.reset()

    return this.resize()
  }

  /**
   * Failure handler for addNote request
   * Restore note message and display error message
   * @param {Object} error http request error
   * @return {Promise} resolved after renderError complete
   */
  addNoteFailureHandler (error) {
    const $note = DOMFinder.getCache(SELECTORS.noteForm).elements['note']
    $note.value = this.originalNoteMessage

    return this.renderError(I18n.t('contact.error', {error: `${error.status} ${error.statusText}`}))
  }

  /**
   * Add requester as a new contact through highrise API and display new contact details/error
   * @param {Event} event click event trigger the addContact
   */
  async addContact (event) {
    event.preventDefault()

    render(SELECTORS.addContactLink, getLoaderTemplate())

    let requesterNames = ['']
    /* istanbul ignore else */
    if (this.requester && this.requester.name) {
      requesterNames = this.requester.name.split(' ')
    }

    // TODO: send requesterOrganization and requesterPhone after they're added to Ticket Data API
    const data = getContactXMLTemplate(
      {
        firstName: requesterNames.shift(),
        lastName: requesterNames.join(' '),
        companyName: '',
        email: this.requester.email,
        phoneNumber: ''
      }
    )
    const options = buildPOSTRequest(
      this.domain + END_POINTS.PEOPLE,
      data,
      this.token
    )

    await this._client.request(options)
      .then(this.addContactSuccessHandler.bind(this))
      .catch(this.addContactFailureHandler.bind(this))
  }

  /**
   * Success handler for addContact request
   * Re-render contact section if contact successfully added
   * @return {Promise} resolved after loadRequesterDetails complete
   */
  addContactSuccessHandler () {
    this.resetError()
    return this.loadRequesterDetails()
  }

  /**
   * Failure handler for addContact request
   * Re-render contact section and display error message
   * @param {Object} error http request error
   * @return {Promise} resolved after resize complete
   */
  addContactFailureHandler (error) {
    this.renderError(I18n.t('contact.error', {error: `${error.status} ${error.statusText}`}))

    render(SELECTORS.contactContainer, getContactTemplate())
    return this.resize()
  }

  /**
   * Dom operations to show note form
   * @param {Event} event click event trigger the showNoteForm
   * @return {Promise} resolve after resize complete
   */
  showNoteForm (event) {
    event.preventDefault()

    const $contactContainer = DOMFinder.getCache(SELECTORS.contactContainer)
    const $noteField = DOMFinder.getCache(SELECTORS.noteField)

    $contactContainer.classList.remove('showAdded')
    $contactContainer.classList.add('showForm')
    $noteField.focus()

    return this.resize()
  }

  /**
   * Dom operations to hide note form
   * @param event form reset event object
   * @return {Promise} resolve after resize complete
   */
  hideNoteForm (event) {
    const $contactContainer = DOMFinder.getCache(SELECTORS.contactContainer)
    $contactContainer.classList.remove('showForm')

    return this.resize()
  }

  /**
   * Dom operations to hide search results
   * @param event click event object
   * @return {Promise} resolve after resize complete
   */
  hideResults (event) {
    event.preventDefault()

    const $appContainer = DOMFinder.getCache(SELECTORS.appContainer)
    $appContainer.classList.remove('showResults')

    return this.resize()
  }

  /**
   * Render error message
   * @param {String} message
   * @return {Promise} resolve after resize complete
   */
  renderError (message) {
    render(SELECTORS.error, getErrorTemplate({ message }))
    return this.resize()
  }

  /**
   * Reset error message section
   * @return {Promise} resolve after resize complete
   */
  resetError () {
    render(SELECTORS.error, getErrorTemplate())
    return this.resize()
  }
}

export default Highrise
