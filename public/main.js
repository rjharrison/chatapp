$(function(){

    // dirty globals. @todo refactor
    var userId, socket;


    var LoginView = Backbone.View.extend({

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
        helloTemplate: _.template('<h2>Hi <span class="userid"><%= name %></span>! Pick someone to chat with...</h2>'),

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

    var UserList = Backbone.View.extend({
        selectTemplate: _.template('<% if (!hasUsers) { %>You have no friends online. Perhaps someone else will login soon?<% } else { %><select class="userlist"></select><% } %>'),
        optionTemplate: _.template('<option value=<%= userId %>><%= name %></option>'),

        render: function (users) {
            // replaces list with empty select
            this.$el.html(this.selectTemplate({hasUsers: Object.keys(users).length >1 }));

            // Update the select list
            var view = this;
            $.each(users, function(k, v){
                // we don't want to chat to ourself :)
                if (k == userId) { return; }
                view.$('select').append(view.optionTemplate(v));
            });
            $('.js-chat-controls').show();
        }
    });


    var ChatSection = Backbone.View.extend({
        tabCount: 0,
        userIdToTabMap: {},

        // <ul> for nav, <div> for tabs
        mainTemplate: _.template('<ul class="nav nav-tabs js-tab-nav" role="tablist"></ul><div class="tab-content js-tab-content"></div>'),

        // tab header
        navTemplate: _.template('<li><a href="chat-<%= userId %>" aria-controls="home" role="tab" data-toggle="tab"><%= userId %></a></li>'),

        // tab content
        contentTemplate:  _.template('<div role="tabpanel" class="tab-pane active" id="chat-<%= userId %>"><div class="js-chat-content">hey</div></div>'),


        render: function () {
            this.$el.html(this.mainTemplate());
        },

        openChat: function(userId) {
            var $chatTab = this.$('#chat-' + this.tabCount );

            // if the chat tab doesn't exist yet, create one
            if ($chatTab.length == 0) {
                $('.js-tab-nav').append(this.navTemplate({userId: userId}));
                $('.js-tab-content').append(this.contentTemplate({userId: userId}));
            }
        }
    });

    var ChatApp = Backbone.View.extend({
        initialize: function (options) {
            this.options = options;

            this.setupViews();

            // setup the socket on successful "login"
            this.listenTo(this.loginView, 'login-success', function (name, token) {
                this.initSocket(name, token);
            }.bind(this));

            this.loginView.render();
        },

        setupViews: function () {
            this.loginView = new LoginView({el: '.js-login'});
            this.userList = new UserList({el: '.js-userlist'});
            this.chatSection = new ChatSection({el: '.js-chat-container'});
        },

        initSocket: function (name, token) {
            var view = this,
                socket = this.socket = io(this.options.socketUrl);

            socket.on('connect', function () {
                // checks the token and joins the user's "room"
                socket.emit('init', {
                    name: name,
                    token: token
                });
            });

            socket.on('receive message', function (data) {
                uiAddMessage(data.userId, data.message);
            });

            socket.on('userlist', function (data) {
                console.log('userlist', data);
                view.userList.render(data);
            });

            socket.on('connected', function (data) {
                console.log('connected', data);
                userId = data.user.userId;
                view.userList.render(data.users);
            });
        }
    });

    var C = new ChatApp({
        socketUrl: 'http://localhost:3000'
    });




    var uiAddMessage = function (from, msg) {
        var name = $('<span>')
            .attr('class', from != userId ? 'other' : 'self')
            .text(from + ': ');

        var msg = $('<span>').text(msg);

        $('.js-chat-container').append($('<div>').append(name).append(msg));
    };

    // Pick a person
    $('.js-userlist').on('change', function(){
        $('.js-chat-container').text('');
    });

    // Send a message
    $('.js-send-message').on('click', function () {
       var $message = $('.js-message'),
           messageText = $message.val();

       if (!messageText) {
           return;
       }
/*
       socket.emit('send message', {
           fromId: userId,
           toId: $('.js-userlist').val(),
           token: token,
           message: messageText
       });
*/
       $message.val('');
    });



});