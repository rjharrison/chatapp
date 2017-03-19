define(function (){
    return Backbone.View.extend({

        events: {
            'click .js-login-button' : 'doLogin'
        },

        // main "login" box
        loginTemplate: _.template(
            '<h2>Hello, what is your name?</h2>' +
            '<input class="js-name" type="text" width="100"/>' +
            '<input class="btn btn-success js-login-button" type="button" value="Login">'
        ),

        // displayed after login
        helloTemplate: _.template('<h2>Hi <span class="userid"><%= name %></span>! Pick someone to chat with.</h2>'),

        render: function () {
            this.$el.html(this.loginTemplate());
        },

        // handles the login button click
        doLogin: function () {
            var view = this,
                name = view.$('.js-name').val();

            if (!name) { return; }

            // trigger an event on this view, which the parent will pick up
            // (I'm mostly using this "login" concept as a way to present this demo. In the real world I'd expect an already authenticated user with
            // userIds and tokens etc already generated and available to my UI)
            var token = 'abc123';
            view.trigger('login-success', name, token);

            view.$el.fadeOut(200, function () {
                view.$el.html(view.helloTemplate({name: name})).fadeIn(200);
            });
        }
    });
});