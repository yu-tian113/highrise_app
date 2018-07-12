export default function (error) {
  return `
  <div class="c-callout c-callout--error">
    <strong class="c-callout__title"><span dir="ltr">${error.error}</span></strong>
    <p class="c-callout__paragraph">${error.description}</p>
  </div>
  `
}
