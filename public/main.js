$(function(){

    // dirty globals. @todo refactor
    var userId;


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

    var UserList = Backbone.View.extend({
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


    var ChatSection = Backbone.View.extend({
        rendered: false,

        // <ul> for nav, <div> for tabs
        mainTemplate: _.template(
            '<ul class="nav nav-tabs js-tab-nav" role="tablist"></ul><div class="tab-content js-tab-content"></div>' +
            '<div class="js-chat-inout chat-input"><input width="" class="js-chat-text" /><input type="button" class="btn btn-primary" value="Send"/> </div>'
        ),

        // tab header
        navTemplate: _.template('<li role="presentation"><a href="#chat-<%= userId %>" aria-controls="home" role="tab" data-toggle="tab"><%= name %></a></li>'),

        // tab content
        contentTemplate:  _.template('<div role="tabpanel" class="tab-pane" id="chat-<%= userId %>"><div class="js-chat-content"></div></div>'),


        render: function () {
            this.rendered = true;
            this.$el.html(this.mainTemplate());
        },

        openChat: function(userId, name) {

            if (!this.rendered) {
                this.render();
            }

            var $chatTab = this.$('#chat-' + userId);

            // if the chat tab doesn't exist yet, create one
            if ($chatTab.length == 0) {
                $('.js-tab-nav').append(this.navTemplate({userId: userId, name: name}));
                $('.js-tab-content').append(this.contentTemplate({userId: userId}));
            }

            this.$('a[href="#chat-' + userId + '"]').tab('show');
        }
    });

    var ChatApp = Backbone.View.extend({

        // The "logged in user"
        // - properties are populated during the login flow
        user: {},

        initialize: function (options) {
            this.options = options;
            this.setupViews();

            // setup the socket on successful "login"
            this.listenTo(this.loginView, 'login-success', function (name, token) {
                this.user.name = name;
                this.user.tocken = token;
                this.initSocket(this.user);
            }.bind(this));

            this.loginView.render();
        },

        setupViews: function () {
            this.loginView = new LoginView({el: '.js-login'});
            this.userList = new UserList({el: '.js-userlist', user: this.user});
            this.chatSection = new ChatSection({el: '.js-chat-tabs'});


            this.chatSection.listenTo(this.userList, 'user-selected', function(userId, name){
                this.openChat(userId, name);
            })

        },

        initSocket: function (user) {
            var view = this,
                socket = this.socket = io(this.options.socketUrl);

            socket.on('connect', function () {
                // This is a part of my user/login spoofing. Send the name selected to the server, which returns the "userId"
                // via the "connected" event. In the real world this would still be needed in some form to associate the socket.io "socket.id" with
                // the logged in user's ID.
                socket.emit('init', {
                    name: user.name,
                    token: user.token
                });
            });

            socket.on('receive message', function (data) {
                uiAddMessage(data.userId, data.message);
            });

            // Event handler for refreshing userlist
            socket.on('userlist', function (data) {
                view.userList.render(data);
            });

            // When the user has connected refresh the userlist
            socket.on('connected', function (data) {
                view.user.userId = data.user.userId;
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