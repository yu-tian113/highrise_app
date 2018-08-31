export default function (error) {
  if (error) {
    return `
    <section class="error c-callout c-callout--error">
      <p class="c-callout__title">${error.message}</p>
    </section>
    `
  } else {
    return '<section class="error" placeholder></section>'
  }
}
