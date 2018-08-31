import I18n from '../javascript/lib/i18n.js'
import getLoaderTemplate from './loader'
import searchIcon from '@zendeskgarden/svg-icons/src/12/search-stroke.svg'
export default function () {
  return `
  <section class="search">
    <form class="u-display-flex u-mb-sm u-pv-xxs">
      <div class="u-mr-sm">
        <input name="term" class="c-txt__input c-txt__input--sm c-txt__input--media__body u-pl u-pr-xxs" type="text" placeholder="${I18n.t('search.field_placeholder')}">
        <div class="c-txt__input--media__figure u-position-absolute">
          ${searchIcon}
        </div>
      </div>
      <input name="submit" type="submit" class="c-btn c-btn--primary c-btn--sm" value="${I18n.t('search.button_label')}" />
    </form>
    <span class="results" placeholder></span>
  </section>
  <section class="error" placeholder></section>
  <section class="contact" placeholder>${getLoaderTemplate()}</section>
  `
}
