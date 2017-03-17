$(function(){

    // dirty globals. @todo refactor
    var userId, socket, token = 'abc123';

    $('.js-login-button').on('click', function(){
       var name = $('.js-name').val();
       if (!name) { return; }

       // in the real world we'd pickup the userId from the session/cookie/page
       userId = name;

       // connect to the chat engine
       initSocket(name);

       $('.js-login').fadeOut(200, function(){
           $('.js-chat').fadeIn(200);
       });

       $('.js-userid').text(userId);
    });


    // Setup the socket connection
    var initSocket = function (userId) {
        socket = io('http://localhost:3000/');

        socket.on('connect', function () {
            // checks the token and joins the user's "room"
            socket.emit('init', {
                userId: userId,
                token: token
            });
        });

        socket.on('receive message', function (data) {
            console.log(data);
            uiAddMessage(data.userId, data.message);
        });

        socket.on('userlist', function (data) {
           uiUpdateUserList(data);
        });
    }




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
            console.log(k, userId);
            if (k == userId) {
                return;
            }

            // populate select list with people we can chat to
            var option = $('<option>').val(k).text(k);
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
           userId: userId,
           token: token,
           to: $('.js-userlist').val(),
           message: messageText
       });

       $message.val('');
    });



});