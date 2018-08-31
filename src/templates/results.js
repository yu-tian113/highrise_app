import I18n from '../javascript/lib/i18n.js'
import {templatingLoop as loop, escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
import chevronIcon from '@zendeskgarden/svg-icons/src/12/chevron-left-stroke.svg'
const getPersonsTemplate = (persons) => {
  return loop(
    persons,
    person => `<li class="u-mb-xxs"><a target="_blank" href="${escape(person.url)}">${escape(person.name)}</a></li>`
  )
}

export default function (data) {
  return `
  <div class="results u-ta-left">
    <p class="u-mb-xs"><b>${I18n.t('search_results')} (${data.total})</b></p>
    <ul class="u-mb-sm">
      ${getPersonsTemplate(data.results)}
    </ul>
    <a class="back u-display-flex" href>
      <span class="u-mr-xxs">${chevronIcon}</span>
      ${I18n.t('global.back')}
    </a>
  </div>
  `
}
