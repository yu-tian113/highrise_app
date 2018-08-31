/* global jest */
export const CLIENT = {
  get: (prop) => {
    switch (prop) {
      case 'currentUser': return Promise.resolve({
        'currentUser': {'locale': 'en'}
      })
      case 'ticket.id': return Promise.resolve({
        'ticket.id': 100
      })
      case 'ticket.requester': return Promise.resolve({
        'ticket.requester': {
          'email': 'requester@email.com',
          'name': 'firstname middlename lastname'
        }
      })
    }
  },
  invoke: jest.fn(),
  on: jest.fn()
}

export const APPDATA = {
  metadata: {
    settings: {
      subdomain: 'zendesk',
      token: 'a1b2c3'
    }
  }
}

export const API_RES_NOTFOUND = `
  <?xml version="1.0" encoding="UTF-8"?>
  <people type="array"/>
`

export const API_RES_PERSON = `
  <?xml version="1.0" encoding="UTF-8"?>
  <person>
    <first-name>Sample</first-name>
    <id type="integer">313879991</id>
    <last-name>customer</last-name>
    <title nil="true"></title>
    <company-name nil="true">Sample Company</company-name>
    <avatar_url>/avatar.png</avatar_url>
    <contact-data>
      <instant-messengers type="array"/>
      <phone-numbers type="array">
        <phone-number>
          <number>0412000000</number>
        </phone-number>
      </phone-numbers>
      <twitter-accounts type="array">
        <twitter-account>
          <username>sampletwitter</username>
        </twitter-account>
      </twitter-accounts>
      <email-addresses type="array">
        <email-address>
          <address>customer@example.com</address>
          <id type="integer">183617603</id>
          <location>Work</location>
        </email-address>
      </email-addresses>
    </contact-data>
  </person>
`

export const API_RES_PEOPLE = `
  <?xml version="1.0" encoding="UTF-8"?>
  <people type="array">
    <person>
      <first-name>Sample</first-name>
      <id type="integer">313879991</id>
      <last-name>customer 1</last-name>
      <title nil="true"></title>
      <company-name nil="true"></company-name>
      <avatar_url>/avatar.png</avatar_url>
      <contact-data>
        <instant-messengers type="array"/>
        <phone-numbers type="array"/>
        <twitter-accounts type="array"/>
        <email-addresses type="array">
          <email-address>
            <address>customer1@example.com</address>
            <id type="integer">183617603</id>
            <location>Work</location>
          </email-address>
        </email-addresses>
      </contact-data>
    </person>
    <person>
    <first-name>Sample</first-name>
    <id type="integer">313879992</id>
    <last-name>customer 2</last-name>
    <title nil="true"></title>
    <company-name nil="true"></company-name>
    <avatar_url>/avatar.png</avatar_url>
    <contact-data>
      <instant-messengers type="array"/>
      <phone-numbers type="array"/>
      <twitter-accounts type="array"/>
      <email-addresses type="array">
        <email-address>
          <address>customer2@example.com</address>
          <id type="integer">183617604</id>
          <location>Work</location>
        </email-address>
      </email-addresses>
    </contact-data>
  </person>
  </people>
`

export const API_RES_NOTE_ADDED = `
  <?xml version="1.0" encoding="UTF-8"?>
  <note>
    <author-id type="integer">100000</author-id>
    <collection-id type="integer" nil="true"></collection-id>
    <collection-type nil="true"></collection-type>
    <created-at type="datetime">2018-07-23T03:52:53Z</created-at>
    <group-id type="integer" nil="true"></group-id>
    <id type="integer">2000002</id>
    <owner-id type="integer" nil="true"></owner-id>
    <subject-id type="integer">3000003</subject-id>
    <subject-type>Party</subject-type>
    <updated-at type="datetime">2018-07-23T03:52:53Z</updated-at>
    <visible-to>Everyone</visible-to>
    <body>test note (Zendesk Support ticket #11)</body>
    <subject-name>Sample customer</subject-name>
  </note>
`
