export const CLIENT = {
  get: (prop) => {
    switch (prop) {
      case 'currentUser': return Promise.resolve({
        'currentUser': {'locale': 'en'}
      })
    }
  }
}

export const AGENTS = {
  'users': [
    {
      'id': 364556238952,
      'name': 'Tony Tian',
      'email': 'ttian@zendesk.com'
    },
    {
      'id': 366617360232,
      'name': 'Agent 1',
      'email': 'ttian-agent-test-1@zendesk.com'
    },
    {
      'id': 366617366212,
      'name': 'agent-2',
      'email': 'ttian-agent-test-2@zendesk.com'
    }
  ],
  'next_page': null,
  'previous_page': null,
  'count': 3
}
