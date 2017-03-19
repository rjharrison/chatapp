define([
    './views/LoginView',
    './views/ChatSectionView',
    './views/UserListView'
], function (
    LoginView,
    ChatSectionView,
    UserListView
){
    return Backbone.View.extend({

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
            this.userList = new UserListView({el: '.js-userlist', user: this.user});
            this.chatSection = new ChatSectionView({el: '.js-chat-tabs', user: this.user});
        },

        wireEvents: function () {

            // setup the socket.io socket on successful "login"
            this.listenTo(this.loginView, 'login-success', function (name, token) {
                this.user.name = name;
                this.user.tocken = token;
                this.initSocket(this.user);
            }.bind(this));

            //  when the user is selected, open a chat tab with them
            this.chatSection.listenTo(this.userList, 'user-selected', function (userId, name) {
                this.openChat(userId, name);
            });

            this.listenTo(this.chatSection, 'send-message', function (toId, message) {
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
});

