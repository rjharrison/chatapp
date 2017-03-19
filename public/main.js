$(function(){

    // dirty globals. @todo refactor
    var userId, socket,
        token = 'abc123';


    var UserList = Backbone.View.extend({
        selectTemplate: _.template('<% if (!hasUsers) { %>You have no friends online. Perhaps someone else will login soon...<% } else { %><select class="userlist"></select><% } %>'),
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
        initialize: function () {
            this.userList = new UserList({el: '.js-userlist'});
            this.chatSection = new ChatSection({el: '.js-chat-container'});
        }
    });
    var C = new ChatApp();



    $('.js-login-button').on('click', function(){
       var name = $('.js-name').val();
       if (!name) { return; }

       // connect to the chat engine
       initSocket(name);

       $('.js-login').fadeOut(200, function () {
           $('.js-chat').fadeIn(200);
       });
    });


    // Setup the socket connection
    var initSocket = function (name) {
        socket = io('http://localhost:3000/');

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
            C.userList.render(data);
        });

        socket.on('connected', function (data) {
            userId = data.user.userId;
            $('.js-userid').text(data.user.name);

            C.userList.render(data.users);
        });
    };


    var uiAddMessage = function (from, msg) {
        var name = $('<span>')
            .attr('class', from != userId ? 'other' : 'self')
            .text(from + ': ');

        var msg = $('<span>').text(msg);

        $('.js-chat-container').append($('<div>').append(name).append(msg));
    };

    var uiUpdateUserList = function (userlist) {

        // no users (we will always be in the list, hence == 1)
        if (Object.keys(userlist).length == 1) {
            $('.js-sadtimes').show();
            $('.js-chat-controls').hide();
            return;
        }

        // some users to chat to!
        $('.js-sadtimes').hide();
        $('.js-userlist option').remove();
        $.each(userlist, function(k, v){
            // we don't want to chat to ourself :)
            if (k == userId) {
                return;
            }

            // populate select list with people we can chat to
            var option = $('<option>').val(k).text(v.name);
           $('.js-userlist').append(option);
        });
        $('.js-chat-controls').show();
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

       socket.emit('send message', {
           fromId: userId,
           toId: $('.js-userlist').val(),
           token: token,
           message: messageText
       });

       $message.val('');
    });



});