import {escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
export default function (data) {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<person>
  <first-name>${escape(data.firstName)}</first-name>
  <last-name>${escape(data.lastName)}</last-name>
  <company-name>${escape(data.companyName)}</company-name>
  <contact-data>
    <email-addresses>
      <email-address>
        <address>${escape(data.email)}</address>
        <location>Work</location>
      </email-address>
    </email-addresses>
    <phone-numbers>
      <phone-number>
        <number>${escape(data.phoneNumber)}</number>
        <location>Work</location>
      </phone-number>
    </phone-numbers>
  </contact-data>
</person>
`
}
