import I18n from '../javascript/lib/i18n.js'
import {escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
import plusIcon from '@zendeskgarden/svg-icons/src/12/plus-circle-stroke.svg'
import userIcon from '@zendeskgarden/svg-icons/src/12/user-solo-stroke.svg'
import emailIcon from '@zendeskgarden/svg-icons/src/12/email-stroke.svg'

const getUserDetailsTemplate = (data) => {
  return `
  <section class="contact u-pt">
    <ul class="u-ta-left u-mb-xs">
      ${getAvatar(data)}
      ${getCompany(data.companyName)}
      ${getEmails(data.emails)}
      ${getPhones(data.phoneNumbers)}
      ${getTweeters(data.twitter_accounts)}
      <li class="note_added">
        ${plusIcon}
        <b class="u-ml-xs">${I18n.t('note.added')} - </b><a href class="show_note_form">${I18n.t('note.create_another')}</a>
      </li>
      <li class="u-display-flex note_new">
        ${plusIcon}
        <a href class="show_note_form u-ml-xs"">${I18n.t('note.add_to', {name: data.firstName})}</a>
      </li>
    </ul>
    <form>
      <textarea name="note" class="c-txt__input c-txt__input--area is-resizable u-mb-sm"></textarea>
      <div class="u-ta-right">
        <input type="reset" class="c-btn c-btn--basic c-btn--sm u-mr-sm" value="${I18n.t('global.cancel')}">
        <input type="submit" name="submit" class="c-btn c-btn--primary c-btn--sm" value="${I18n.t('global.submit')}">
      </div>
    </form>
  </section>
  `
}

const getAvatar = (data) => {
  let background = ''
  /* istanbul ignore else */
  // if (data.avatarURL) background = `style="background: url(${data.avatarURL}) no-repeat 0 2px; background-size: 12px 12px;""`
  return `
  <li class="u-display-flex u-mb-xxs" ${background}>
    ${userIcon}
    <a class="u-ml-xs" target="_blank" href="${escape(data.url)}">${escape(data.firstName)} ${escape(data.lastName)} ${escape(data.title) || ''}</a>
  </li>
  `
}

const getCompany = (company) => {
  /* istanbul ignore else */
  if (company) return `<li class="u-display-flex">${escape(company)}</li>`
  else return ''
}

const getEmails = (emails) => {
  return emails.reduce((accum, email) => {
    return accum + `
      <li class="u-display-flex u-mb-xxs">
        ${emailIcon}
        <a class="u-ml-xs" href="mailto:${escape(email.address)}">${escape(email.address)}</a>
      </li>`
  }, '')
}

const getPhones = (phones) => {
  return phones.reduce((accum, phone) => {
    return accum + `<li class="u-display-flex u-mb-xxs"><b>${escape(phone.number)}</b></li>`
  }, '')
}

const getTweeters = (tweeters) => {
  return tweeters.reduce((accum, tweeter) => {
    return accum + `<li class="u-display-flex u-mb-xxs">@${escape(tweeter.username)}</li>`
  }, '')
}

const getNotFoundTemplate = () => {
  return `
  <section class="contact u-pv">
    <p>${I18n.t('contact.not_found')}</p>
    <p><a class="add_contact" href>${I18n.t('contact.add_to_highrise')}</a></p>
  </section>
  `
}

export default function (data) {
  return (
    data
      ? getUserDetailsTemplate(data)
      : getNotFoundTemplate()
  )
}
