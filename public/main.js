$(function(){

    // dirty globals. @todo refactor
    var userId, socket,
        token = 'abc123';

    var TabNav = Backbone.View.extend({
        tagName: 'li',
        template: _.template('<a href="chat-<%= userId %>" aria-controls="home" role="tab" data-toggle="tab"><%= userId %></a>'),

        initialize: function(options) {
            this.userId = options.userId
        },

        render: function(){
            this.$el.html(this.template({userId: this.userId}));
        }
    });

    var TabContent = Backbone.View.extend({
        tagName: 'div',
        initialize: function(options){
            this.userId = options.userId
        },

        template: _.template('<div role="tabpanel" class="tab-pane active" id="chat-<%= userId %>"><div class="js-chat-content">hey</div></div>'),

        render: function(){
            this.$el.html(this.template({userId: this.userId}));
        }
    });

    var ChatSection = Backbone.View.extend({

        tabCount: 0,
        userIdToTabMap: {},

        openChat: function(userId) {

            var tabId = this.u

            var $chatTab = this.$('#chat-' + this.tabCount );

            // if the chat tab doesn't exist yet, create one
            if ($chatTab.length == 0) {
                var opts = {userId: userId},
                    navItem = new TabNav(opts),
                    tabContent = new TabContent(opts);

                navItem.render(opts);
                tabContent.render(opts);

                $('.js-tab-nav').append(navItem.$el);
                $('.js-tab-content').append(tabContent.$el);

                $chatTab = navItem.$el;
            }
        }
    });


    //
    var chatSection = new ChatSection({el: '.js-chat-container'});


    $('.js-login-button').on('click', function(){
       var name = $('.js-name').val();
       if (!name) { return; }

       // connect to the chat engine
       initSocket(name);

       $('.js-login').fadeOut(200);
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
            console.log(userId);
            uiUpdateUserList(data);
        });

        socket.on('connected', function (data) {
            userId = data.user.userId;
            $('.js-chat').fadeIn(200);
            $('.js-userid').text(data.user.name);

            uiUpdateUserList(data.users);
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