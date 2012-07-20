(function() {

  return {
    defaultState: 'loading',

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

    requests: {
      addNote: function(data)             { return this._postRequest(data, this.resources.NOTES_URI); },
      addContact: function(data, userID)  { return this._postRequest(data, this.resources.PEOPLE_URI); },
      lookupByEmail: function(email)      { return this._getRequest(helpers.fmt(this.resources.EMAIL_LOOKUP_URI, email)); },
      search: function(str)               { return this._getJsonRequest(helpers.fmt(this.resources.SEARCH_URI, str)); }
    },

    events: {
      'click .note a': function() {
        this.$('.note .add_note:first').show();
        this.$('.note .add_note:last').hide();
        this.$('.note form').show();
        this.$('.note textarea').focus();
      },

      'click .note .cancel':    function() { this.$('.note form').hide(); },
      'click .note .submit':    'submitNote',
      'click .add_contact a':   function() { this.ajax('addContact', this._addContactData()); },
      'click .back a':          function() { this.ajax('lookupByEmail', this.ticket().requester().email()); },
      'click .search':          function() { this.ajax('search', this.$('input.search_term').val()); },
      'keypress .search_term':  function(event) { if ( event.which === 13 ) { this.ajax('search', this.$('input.search_term').val()); } },

      'app.activated': 'firstLookup',
      'ticket.requester.email.changed': 'firstLookup',

      /** AJAX callbacks **/
      'addContact.fail':    function(jqXHR, textStatus, errorThrown) { this.showError(this.I18n.t('contact.problem', { error: errorThrown.toString() })); },
      'addContact.done': function(data, textStatus, jqXHR) { this.ajax('lookupByEmail', this.ticket().requester().email()); },

      'addNote.fail': function(jqXHR, textStatus, errorThrown) {
        var form = this.$('.note form');

        this.showError(this.I18n.t('contact.problem', { error: errorThrown.toString() }));
        this.enableSubmit(form);
      },

      'addNote.done': function(data, textStatus, jqXHR) {
        var form = this.$('.note form');

        this.resetForm(form);
        this.enableSubmit(form);
        form.hide();
        this.$('.note .add_note').toggle();
      },

      'lookupByEmail.fail': function() {
        this.$('.search_section').hide();
        this.switchTo('auth_error');
      },

      'lookupByEmail.done':  'handleLookupResult',
      'search.done':         'handleSearchResult'
    },

    firstLookup: function() {
      var requesterEmail = this.ticket().requester().email();
      if ( !requesterEmail ) { return; }

      this.ajax('lookupByEmail', requesterEmail, this.settings.token);
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

      textArea.val(this.I18n.t('note.body.message', { value: textArea.val(), ticketID: this.ticket().id() }));
      this.disableSubmit(form);
      this.ajax('addNote', this._addNoteData({ body: textArea.val(), personID: personID }));
    },

    handleLookupResult: function(data) {
      var result, results, userData;

      // This section starts hidden, and as lookupByEmail is the first thing called...
      this.$('.search_section').show();

      results = this.$(data).find('people');
      if (results.length === 0) {
        this.switchTo('not_found');
        return;
      }

      result = results.find('person:first');
      userData = {
        avatarURL:        result.children('avatar-url').text(),
        companyName:      result.children('company-name').text(),
        emails:           this._extractInfo(result, 'contact-data > email-addresses > email-address', ['address']),
        firstName:        result.children('first-name').text(),
        im_accounts:      this._extractInfo(result, 'contact-data > instant-messengers > instant-messenger', ['address', 'protocol']),
        name:             helpers.fmt("%@ %@", result.children('first-name').text(), result.children('last-name').text()),
        personID:         result.children('id').text(),
        phoneNumbers:     this._extractInfo(result, 'contact-data > phone-numbers > phone-number', ['number']),
        title:            result.find('title').text(),
        twitter_accounts: this._extractInfo(result, 'contact-data > twitter-accounts > twitter-account', ['username'])
      };

      this.switchTo('user', userData);
    },


    handleSearchResult: function(data) {
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
            type:   resource[1].toLowerCase(),
            url:    helpers.fmt("https://%@.highrisehq.com%@", settings.subdomain, url)
          });
        }
      });

      resultsData = {
        total: results.length,
        results: results
      };

      this.switchTo('results', resultsData);
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
      return encodeURI( helpers.fmt(this.xmlTemplates.NOTE, options.body, options.personID) );
    },

    _addContactData: function() {
      var requesterName = this.ticket().requester().name() || '', name = requesterName.split(' ');
      // TODO: send requesterOrganization and requesterPhone after they're added to Ticket Data API
      return encodeURI(
        helpers.fmt(
          this.xmlTemplates.CONTACT,
          name.shift(),
          name.join(' '),
          '',
          this.ticket().requester().email(),
          ''
        )
      );
    },

    _getJsonRequest: function(resource) {
      return {
        dataType: 'json',
        url:      this._highriseURL(resource),
        headers: {
          'Authorization': 'Basic ' + Base64.encode(helpers.fmt('%@:X', this.settings.token))
        }
      };
    },

    _getRequest: function(resource) {
      return {
        url: this._highriseURL(resource),
        headers: {
          'Authorization': 'Basic ' + Base64.encode(helpers.fmt('%@:X', this.settings.token))
        }
      };
    },

    _highriseURL: function(resource) {
      var settings = this.settings;
      return helpers.fmt(
        this.resources.HIGHRISE_URI,
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
          'Authorization': 'Basic ' + Base64.encode(helpers.fmt('%@:X', this.settings.token))
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
      this.switchTo('error', { message: msg });
    },

    resetForm: function(form) {
      form.find(':input')
          .not(':button, :submit, :reset, :hidden')
          .val('')
          .removeAttr('checked')
          .removeAttr('select');
    }
  };

}());
