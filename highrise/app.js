(function() {

  return ZendeskApps.defineApp(ZendeskApps.Site.TICKET_PROPERTIES, {
    appID: '/apps/01-highrise/versions/1.0.0',

    defaultSheet: 'loading',

    dependencies: {
      currentTicketID:  'workspace.ticket.id',
      requester:        'workspace.ticket.requester',
      requesterEmail:   'workspace.ticket.requester.email'
    },

    resources: {
      EMAIL_LOOKUP_URI: "people/search.xml?criteria[email]=%@",
      HIGHRISE_URI:     "http%@://%@.highrisehq.com/%@",
      NOTES_URI:        "notes.xml",
      PEOPLE_URI:       "people.xml",
      SEARCH_URI:       "search.json?term=%@&contenttype=application/json"
    },

    xmlTemplates: {
      CONTACT:  '<?xml version="1.0" encoding="ISO-8859-1"?>' +
                '<person>' +
                '  <first-name>%@</first-name>' +
                '  <last-name>%@</last-name>' +
                '  <company-name>%@</company-name>' +
                '  <contact-data>' +
                '    <email-addresses>' +
                '      <email-address>' +
                '        <address>%@</address>' +
                '        <location>Work</location>' +
                '      </email-address>' +
                '    </email-addresses>' +
                '    <phone-numbers>' +
                '      <phone-number>' +
                '        <number>%@</number>' +
                '        <location>Work</location>' +
                '      </phone-number>' +
                '    </phone-numbers>' +
                '  </contact-data>' +
                '</person>',
      NOTE: '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<note>' +
            '  <body>%@</body>' +
            '  <subject-id type="integer">%@</subject-id>' +
            '  <subject-type>Party</subject-type>' +
            '</note>'
    },

    templates: {
      main: '<div class="highrise_app">' +
            '  <div><h3>{{I18n.app.name}}</h3></div><hr/>' +
            '  <section data-sheet-name="loading" class="loading"></section>' +
            '  <section data-sheet-name="auth_error"><p style="color: red; font-weight: bold;">{{I18n.auth.problem}}</p><p>{{I18n.auth.error}}</p></section>' +
            '  <section data-sheet-name="details"></section>' +
            '  <section data-sheet-name="not_found" class="add_contact">' +
            '    <p>{{I18n.contact.not_found}}</p><p><a href="#" onclick="return false;">{{I18n.contact.add_to_highrise}}</a></p>' +
            '  </section>' +
            '  <section data-sheet-name="message" class="message"></section>' +
            '  <section class="search_section" style="display: none;">' +
            '    <hr/><input class="search_term" placeholder="{{I18n.global.search}}" type="text"/> ' +
            '    <input class="search" type="submit" value="{{I18n.global.search}}"/>' +
            '  </section>' +
            '</div>',
      userData: '<table class="user_data note"><tr><td><img width="12" height="12" src="{{avatarURL}}"/></td><td><b>{{name}}{{#if title}} ({{title}}){{/if}}</b></td>' +
                '{{#if companyName}}<tr><td>C</td><td>{{companyName}}</td></tr>{{/if}}' +
                '{{#emails}}<tr><td>e</td><td>{{address}}</td></tr>{{/emails}}' +
                '{{#phoneNumbers}}<tr><td>P</td><td><b>{{number}}</b></td></tr>{{/phoneNumbers}}' +
                '{{#twitter_accounts}}<tr><td>t</td><td>@{{username}}</td></tr>{{/twitter_accounts}}' +
                '<tr class="add_note"><td>+</td><td><b><a href="#" onclick="return false;">{{I18n.note.add_to}} {{firstName}}</a></td>' +
                '<tr class="add_note" style="display: none"><td>+</td><td><b>{{I18n.note.added}} - </b><a href="#" onclick="return false;">{{I18n.note.create_another}}</a></td>' +
                '<tr><td colspan="2">' +
                '<form style="display: none;">' +
                '<textarea name="body"></textarea>' +
                '<input type="hidden" name="personID" value="{{personID}}"/>' +
                '<input type="reset" value="{{I18n.global.cancel}}" class="cancel"><input type="submit" value="{{I18n.global.submit}}" id="submit" class="submit" onclick="return false;">' +
                '</form>' +
                '</td></tr></table>',
      resultsData:  '<div class="results"><p>{{I18n.search_results}}<b> ({{total}})</b></p>' +
                    '<table>{{#results}}<tr><td>{{type}}</td><td><a target="_blank" href="{{url}}">{{name}}</a></td></tr>{{/results}}</table>' +
                    '<div class="back"><a href="#" onclick="return false;"><< {{I18n.global.back}}</a></div>' +
                    '</div>',
      error:  '<div class="error">{{message}}</div>' +
              '<div class="back"><a href="#" onclick="return false;"><< {{I18n.global.back}}</a></div>'
    },

    requests: {
      addNote: function(data)             { return this._postRequest(data, this.resources.NOTES_URI); },
      addContact: function(data, userID)  { return this._postRequest(data, this.resources.PEOPLE_URI); },
      lookupByEmail: function(email)      { return this._getRequest(this.resources.EMAIL_LOOKUP_URI.fmt(email)); },
      search: function(str)               { return this._getJsonRequest(this.resources.SEARCH_URI.fmt(str)); }
    },

    events: {
      'click .note a': function() {
        this.$('.note .add_note:first').show();
        this.$('.note .add_note:last').hide();
        this.$('.note form').show();
        this.$('.note textarea').focus();
      },

      'click .note .cancel':  function() { this.$('.note form').hide(); },
      'click .note .submit':  'submitNote',
      'click .add_contact a': function() { this.request('addContact').perform(this._addContactData()); },
      'click .back a':        function() { this.request('lookupByEmail').perform(this.deps.requesterEmail); },
      'click .search':        function() { this.request('search').perform(this.$('input.search_term').val()); },

      'requesterEmail.changed': function(e, value) {
        if ( !this.settings.token || !this.deps.requesterEmail ) { return; }

        this.request('lookupByEmail').perform(this.deps.requesterEmail, this.settings.token);
      },

      /** AJAX callbacks **/
      'addContact.fail':    function(event, jqXHR, textStatus, errorThrown) { this.showError(this.I18n.t('contact.problem', { error: errorThrown.toString() })); },
      'addContact.success': function(event, data, textStatus, jqXHR) { this.request('lookupByEmail').perform(this.deps.requesterEmail); },

      'addNote.fail': function(event, jqXHR, textStatus, errorThrown) {
        var form = this.$('.note form');

        this.showError(this.I18n.t('contact.problem', { error: errorThrown.toString() }));
        this.enableSubmit(form);
      },

      'addNote.success': function(event, data, textStatus, jqXHR) {
        var form = this.$('.note form');

        this.resetForm(form);
        this.enableSubmit(form);
        form.hide();
        this.$('.note .add_note').toggle();
      },

      'lookupByEmail.fail': function() {
        this.$('.search_section').hide();
        this.sheet('auth_error').show();
      },

      'lookupByEmail.success':  'handleLookupResult',
      'search.success':         'handleSearchResult'
    },

    submitNote: function() {
      // disable_submit
      var form = this.$('.note form'),
          personID = form.find('input[name=personID]').val(),
          textArea = form.find('textarea');

      if (!textArea.val()) {
        alert(this.I18n.t('note.body.empty'));
        return false;
      }

      textArea.val(this.I18n.t('note.body.message', { value: textArea.val(), ticketID: this.deps.currentTicketID }));
      this.disableSubmit(form);
      this.request('addNote').perform(this._addNoteData({ body: textArea.val(), personID: personID }));
    },

    handleLookupResult: function(e, data) {
      var result, results, userData;

      // This section starts hidden, and as lookupByEmail is the first thing called...
      this.$('.search_section').show();

      results = this.$(data).find('people');
      if (results.length === 0) {
        this.sheet('not_found').show();
        return;
      }

      result = results.find('person:first');
      userData = {
        avatarURL:        result.children('avatar-url').text(),
        companyName:      result.children('company-name').text(),
        emails:           this._extractInfo(result, 'contact-data > email-addresses > email-address', ['address']),
        firstName:        result.children('first-name').text(),
        im_accounts:      this._extractInfo(result, 'contact-data > instant-messengers > instant-messenger', ['address', 'protocol']),
        name:             "%@ %@".fmt(result.children('first-name').text(), result.children('last-name').text()),
        personID:         result.children('id').text(),
        phoneNumbers:     this._extractInfo(result, 'contact-data > phone-numbers > phone-number', ['number']),
        title:            result.find('title').text(),
        twitter_accounts: this._extractInfo(result, 'contact-data > twitter-accounts > twitter-account', ['username'])
      };

      this.sheet('details')
        .render('userData', userData)
        .show();
    },


    handleSearchResult: function(e, data) {
      var self    = this,
          settings  = this.get('settings'),
          parties = data.parties || [],
          regex   = /^\/(people|companies)\/.*/,
          results = [],
          resultsData, name, resource, url;

      this.$(parties).each(function(index, element) {
        name      = element[1];
        url       = element[0];
        resource  = regex.exec(url);

        if (resource) {
          results.push({
            name:   name,
            type:   resource[1][0].toUpperCase(),
            url:    "https://%@.highrisehq.com%@".fmt(settings.subdomain, url)
          });
        }
      });

      resultsData = {
        total: results.length,
        results: results
      };

      this.sheet('details')
        .render('resultsData', resultsData)
        .show();
    },

    _extractInfo: function(result, selector, fields) {
      var self = this;
      return result
        .find(selector)
        .map(function(idx, el) {
          var hash = {};
          self.$(fields).each(function(index, field) {
              hash[field] = self.$(el).find(field).text();
            });
            return hash;
        }).toArray();
    },

    _addNoteData: function(options) {
      return encodeURI( this.xmlTemplates.NOTE.fmt(options.body, options.personID) );
    },

    _addContactData: function() {
      var requester   = this.deps.requester,
          name        = requester.get('name').split(' ');

      return encodeURI(
        this.xmlTemplates.CONTACT
            .fmt(
              name.shift(),
              name.join(' '),
              (requester.get('organization') ? requester.get('organization').get('name') : ''),
              requester.get('email'),
              requester.get('phone') || ''
            )
      );
    },

    _getJsonRequest: function(resource) {
      return {
        dataType: 'json',
        url:      this._highriseURL(resource),
        headers: {
          'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(this.settings.token))
        }
      };
    },

    _getRequest: function(resource) {
      return {
        url: this._highriseURL(resource),
        headers: {
          'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(this.settings.token))
        }
      };
    },

    _highriseURL: function(resource) {
      var settings = this.settings;
      return this.resources.HIGHRISE_URI.fmt(
        settings.useSSL ? 's' : '',
        settings.subdomain,
        resource
      );
    },

    _postRequest: function(data, resource) {
      return {
        dataType: 'xml',
        data:     data,
        type:     'POST',
        url:      this._highriseURL(resource),
        headers: {
          'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(this.settings.token))
        }
      };
    },

    /** Helpers **/
    disableSubmit: function(form) {
      var submit = this.$(form.find('input[type=submit]'));
      submit
        .data('originalValue', submit.val())
        .prop('disabled', true)
        .val(this.I18n.t('global.submitting'));
    },

    enableSubmit: function(form) {
      var submit = this.$(form.find('input[type=submit]'));
      submit
        .prop('disabled', false)
        .val(submit.data('originalValue'));
    },

    showError: function(msg) {
      this.sheet('message')
        .render('error', { message: msg })
        .show();
    },

    resetForm: function(form) {
      form.find(':input')
          .not(':button, :submit, :reset, :hidden')
          .val('')
          .removeAttr('checked')
          .removeAttr('select');
    }
  });

}());
