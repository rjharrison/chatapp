define(function () {
    return Backbone.View.extend({
        selectTemplate: _.template('<% if (!hasUsers) { %>You have no friends online. Perhaps someone else will login soon?<% } else { %><select class="userlist"><option/></select><% } %>'),
        optionTemplate: _.template('<option value=<%= userId %>><%= name %></option>'),

        events: {
            'change select': 'userSelected'
        },

        initialize: function (options) {
            // we pass the "logged in user" object from the parent view into the child
            this.user = options.user;
        },

        render: function (users) {
            // replaces list with empty select
            this.$el.html(this.selectTemplate({hasUsers: Object.keys(users).length >1 }));

            // Update the select list
            var view = this;
            $.each(users, function(k, v){
                // we don't want to chat to ourself :)
                if (k == view.user.userId) { return; }
                view.$('select').append(view.optionTemplate(v));
            });
            $('.js-chat-controls').show();
        },

        userSelected: function () {
            var userId = this.$('option:selected').val(),
                name = this.$('option:selected').text();

            this.trigger('user-selected', userId, name);
        }
    });
});