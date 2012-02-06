//= require ./app.js

(function() {

  Zendesk.Apps.HighriseApp = Zendesk.Apps.App.extend({
    location: Zendesk.Apps.Site.TICKET_PROPERTIES,
    appID: '/apps/01-highrise/versions/1.0.0',
    name: 'Highrise',

    defaultSheet: 'loading',

    dependencies: {
      currentTicketID:  'Zendesk.currentTicket.id',
      requester:        'Zendesk.currentTicket.requester',
      requesterEmail:   'Zendesk.currentTicket.requester.email'
    },

    translations: {
      auth:     {
        error: "We couldn't authenticate into Highrise",
        problem: "There's been a problem!"
      },

      contact:  {
        add_to_highrise: "Add this Zendesk user to Highrise",
        not_found: "No contact found with this email address",
        problem: "There's been a problem: %@"
      },

      global:   {
        back: "Back",
        cancel: "Cancel",
        search: "search",
        submit: "Submit",
        submitting: "Submitting..."
      },

      note:     {
        add_to: "Add a Note to",
        added: "Note Added",
        body: {
          empty: "Note body is empty!",
          message: "{{value}} (Zendesk ticket #{{ticketID}})"
        },
        create_another: "Create Another"
      },

      search_results: "Search Results"
    },

    // Local var
    resources: {
      HIGHRISE_URI: 'http%@://%@.highrisehq.com/%@',
      PROXY_URI:    '/proxy/direct?url=%@&timeout=10'
    },

    xmlTemplates: {
      CONTACT:  'body=<?xml version="1.0" encoding="ISO-8859-1"?>' +
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
      NOTE: 'body=<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<note>' +
            '  <body>%@</body>' +
            '  <subject-id type="integer">%@</subject-id>' +
            '  <subject-type>Party</subject-type>' +
            '</note>'
    },

    templates: {
      main: '<div class="highrise_app">' +
            '  <div><h3>Highrise</h3></div><hr/>' +
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
      addNote: function(data, userID) {
        return {
          data:     data,
          dataType: 'xml',
          type:     'POST',
          url:      this._addNoteURL(),
          headers: {
            'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(userID))
          }
        };
      },

      addContact: function(data, userID) {
        return {
          data:     data,
          dataType: 'xml',
          type:     'POST',
          url:      this._addContactURL(),
          headers: {
            'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(userID))
          }
        };
      },

      lookupByEmail: function(email, userID) {
        return {
          url: this._emailLookupURL(email),
          headers: {
            'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(userID))
          }
        };
      },

      search: function(str, userID) {
        return {
          dataType: 'json',
          url: this._searchURL(str),
          headers: {
            'Authorization': 'Basic ' + Base64.encode('%@:X'.fmt(userID))
          }
        };
      }
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
      'click .add_contact a': function() { this.request('addContact').perform(this._addContactData(), this.config.token); },
      'click .back a':        function() { this.request('lookupByEmail').perform(this.deps.requesterEmail, this.config.token); },
      'click .search':        function() { this.request('search').perform(this.$('input.search_term').val(), this.config.token); },

      'requesterEmail.changed': function(e, value) {
        if (this.config.token) {
          Em.run.next(this, function() {
            this.request('lookupByEmail').perform(this.deps.requesterEmail, this.config.token);
          });
        }
      },

      /** AJAX callbacks **/
      'addContact.fail':    function(event, jqXHR, textStatus, errorThrown) { this.showError(this.I18n.t('contact.problem', { error: errorThrown.toString() })); },
      'addContact.success': function(event, data, textStatus, jqXHR) { this.request('lookupByEmail').perform(this.deps.requesterEmail, this.config.token); },

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
      this.request('addNote').perform(this._addNoteData({ body: textArea.val(), personID: personID }), this.config.token);
    },

    handleLookupResult: function(e, data) {
      var result, results, userData;

      // This section starts hidden, and as lookupByEmail is the first thing called...
      this.$('.search_section').show();

      results = $(data).find('people');
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
          config  = this.get('config'),
          parties = data.parties || [],
          regex   = /^\/(people|companies)\/.*/,
          results = [],
          resultsData, name, resource, url;

      $(parties).each(function(index, element) {
        name      = element[1];
        url       = element[0];
        resource  = regex.exec(url);

        if (resource) {
          results.push({
            name:   name,
            type:   resource[1][0].toUpperCase(),
            url:    "https://%@.highrisehq.com%@".fmt(config.subdomain, url)
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
      return result
        .find(selector)
        .map(function(idx, el) {
          var hash = {};
          $(fields).each(function(index, field) {
              hash[field] = $(el).find(field).text();
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

    _addContactURL: function() {
      return this._proxyURL("people.xml");
    },

    _addNoteURL: function() {
      return this._proxyURL("notes.xml");
    },

    _emailLookupURL: function(email) {
      return this._proxyURL("people/search.xml?criteria[email]=%@".fmt(email));
    },

    _searchURL: function(term) {
      return this._proxyURL("search.json?term=%@&contenttype=application/json".fmt(term));
    },

    _proxyURL: function(resource) {
      var config = this.config;
      return encodeURI(
        this.resources.PROXY_URI
            .fmt(
              this.resources.HIGHRISE_URI
                  .fmt(
                    config.useSSL ? 's' : '',
                    config.subdomain,
                    resource
                  )
            )
       );
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
