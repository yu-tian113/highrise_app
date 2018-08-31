import {escapeSpecialChars as escape} from '../javascript/lib/helpers.js'
export default function (data) {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<note>
  <body>${escape(data.body)}</body>
  <subject-id type="integer">${escape(data.personID)}</subject-id>
  <subject-type>Party</subject-type>
</note>
`
}
