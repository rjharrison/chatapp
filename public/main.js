$(function(){

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
        chattingWith: '',
        user: {},

        // <ul> for nav, <div> for tabs
        mainTemplate: _.template(
            '<ul class="nav nav-tabs js-tab-nav" role="tablist"></ul><div class="tab-content js-tab-content"></div>' +
            '<div class="js-chat-inout chat-input"><input width="" class="js-chat-message" /><input type="button" class="js-chat-send btn btn-primary" value="Send"/> </div>'
        ),

        // tab header
        navTemplate: _.template('<li role="presentation"><a data-userId="<%= userId %>" href="#chat-<%= userId %>" aria-controls="home" role="tab" data-toggle="tab"><%= name %></a></li>'),

        // tab content
        contentTemplate:  _.template('<div role="tabpanel" class="tab-pane" id="chat-<%= userId %>"><div class="js-chat-content"></div></div>'),

        // message template
        messageTemplate: _.template('<div class="message <%= msgClass %>"><span class="name"><%= fromName %>:</span> <%= message %> </div>'),

        events: {
            'click .js-chat-send': 'sendMessage'
        },

        initialize: function (options) {
            // we pass the "logged in user" object from the parent view into the child
            this.user = options.user;
        },

        render: function () {
            this.rendered = true;
            this.$el.html(this.mainTemplate());

            this.$el.on('show.bs.tab', 'a[data-toggle="tab"]', function (e) {
                this.chattingWith = $(e.target).data('userid');
            }.bind(this));
        },

        openChat: function(userId, name) {
            // ensure tab is created
            this.createTab(userId, name);

            // focus the tab
            this.$('a[href="#chat-' + userId + '"]').tab('show');
            this.chattingWith = userId;
        },

        // Create a chat tab (only if it doesn't already exist)
        createTab: function(userId, name) {
            if (!this.rendered) {
                this.render();
            }

            var $chatTab = this.$('#chat-' + userId);
            if ($chatTab.length == 0) {
                // if the chat tab doesn't exist yet, create one
                $('.js-tab-nav').append(this.navTemplate({userId: userId, name: name}));
                $('.js-tab-content').append(this.contentTemplate({userId: userId}));
            }
        },

        sendMessage: function () {
            var $message = this.$('.js-chat-message'),
                messageText = $message.val();

            if (!messageText) { return; }

            // trigger an event (to be caught by the parent view)
            this.trigger('send-message', this.chattingWith, messageText);

            // reset the text input
            $message.val('');
        },

        receiveMessage: function (data) {
            // are we receiving a message we sent to someone else, or a message someone else sent to us?
            var isFromSelf = data.fromId == this.user.userId;

            // the tab to update
            var targetId = isFromSelf ? data.toUser.userId : data.fromUser.userId;
            var targetName = isFromSelf ? data.toUser.name : data.fromUser.name;

            // ensure there is a chat tab created to inject the message into
            // - if we're not currently chatting with anyone, trigger the openChat() function
            if (!this.chattingWith) {
                this.openChat(targetId, targetName);
            } else {
                this.createTab(targetId, targetName);
            }

            // update the appropriate message pane content with the incoming message
            var $targetTab = $('#chat-' + targetId);
            $targetTab
                .append(this.messageTemplate({
                    msgClass: isFromSelf ? 'self' : 'other',
                    fromName: data.fromUser.name,
                    message: data.message
                }));

            // ensure the last line of chat is visible
            var element = $targetTab.get(0);
            element.scrollTop = element.scrollHeight;

            // @todo make the nav tab flash if not current active chat tab
        }

    });

    var ChatApp = Backbone.View.extend({

        // The "logged in user"
        // - properties are populated during the login flow
        user: {},

        template: _.template(
            '<div class="js-login"></div>' +
            '<div class="js-userlist"></div>' +
            '<div class="js-chat-tabs chat-tabs"></div>' +
            '<div class="js-chatinput"></div>'
        ),

        initialize: function (options) {
            this.options = options;
            this.render();
            this.setupViews();
            this.wireEvents();

            this.loginView.render();
        },

        setupViews: function () {
            this.loginView = new LoginView({el: '.js-login'});
            this.userList = new UserList({el: '.js-userlist', user: this.user});
            this.chatSection = new ChatSection({el: '.js-chat-tabs', user: this.user});
        },

        wireEvents: function () {

            // setup the socket.io socket on successful "login"
            this.listenTo(this.loginView, 'login-success', function (name, token) {
                this.user.name = name;
                this.user.tocken = token;
                this.initSocket(this.user);
            }.bind(this));

            //  when the user is selected, open a chat tab with them
            this.chatSection.listenTo(this.userList, 'user-selected', function(userId, name){
                this.openChat(userId, name);
            });

            this.listenTo(this.chatSection, 'send-message', function(toId, message) {
                this.socket.emit('send message', {
                    fromId: this.user.userId,
                    toId: toId,
                    token: this.user.token,
                    message: message
                });
            });

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
                view.chatSection.receiveMessage(data);
            });

            // Event handler for refreshing userlist
            socket.on('userlist', function (data) {
                view.userList.render(data); // refresh the drop down
            });

            // When the user has connected refresh the userlist
            socket.on('connected', function (data) {
                view.user.userId = data.user.userId;
                view.userList.render(data.users);
            });
        },

        render: function () {
            this.$el.html(this.template());
        }
    });

    var C = new ChatApp({
        el: '.js-chatapp',
        socketUrl: 'http://localhost:3000'
    });
});