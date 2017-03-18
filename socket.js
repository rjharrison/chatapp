var crypto = require('crypto');

// Authentication/Authorization
var auth = require('./app/auth');

// Load the desired message handlers (I'm using this as a hacky DI, but this could be configurable and dynamic)
// (See the loop below inside "send message" callback)
var msgHandlers = require('./app/msghandlers').get(['badwords']);

// list of users available to talk to (one global list for this demo)
var users = {};

module.exports = function(server) {
    var io = require('socket.io')(server);

    io.on('connection', function(socket){

        /**
         * This event is fired after the client has connected. Perform any setup here.
         */
        socket.on('init', function (data) {

            // In this demo there are no persistent users. This simulates retrieving and authenticating a user
            var user = {
                userId: crypto.createHash('md5').update(data.name).digest('hex'),
                name: data.name
            };

            // Authenticate
            if (!auth.isTokenValid(user.userId, data.token)) {
                return; // @todo throw not authorized error / event
            }

            // Add this socket to the user's "room"
            // - We use this room as a channel for any events directed at this user, allowing him to have multiple sockets attached
            // - Also allows us to send messages to a user without knowing what his socket.id's are
            socket.join(user.userId);

            // Attach the userId to the socket so that later we can determine userId from socket without storing a hash of them
            socket.userId = user.userId;


            // Update the users list (and broadcast it to everyone - not suitable for production but works for this POC)
            if (!users[user.userId]) {
                users[user.userId] = user;
                socket.broadcast.emit('userlist', users);
            }

            // Let the client know we're now connected and send the users list as well.
            socket.emit('connected', {user: user, users: users});
        });

        /**
         * This is fired after client sends a message
         */
        socket.on('send message', function (data) {
            var state = {
                isOk : true
            }

            // check if we're authenticated and authorized to send this message
            if (!(auth.isTokenValid(data.userId, data.token) && auth.canSendMessage(data.userId, data.to))) {
                return; // ... @todo trigger an error
            }

            /**
             * Apply all registered handlers
             *
             * This is a way of injecting/chaining behaviour together (kinda like Express middleware). We could create handlers to
             * persist the data, send it to a message queue, do any logging or filtering, trigger notifications/emails etc. Preference would be to offload anything
             * load intensive by dumping the request into a message queue and have workers pick it up outside of the chat engine
             */
            msgHandlers.forEach(function(handler){
                handler.execute(data, state);
            });


            if (state.isOk === true) {
                // send event to the recipient
                socket.to(data.to).emit('receive message', data);

                // send event to ourself (needed to that the client can update its UI with any filtered words...)
                socket.emit('receive message', data);
            } else {
                // @todo trigger an error
            }
        });

        socket.on('disconnect', function (data) {
            // remove the user from the list of "logged in users" this disconnect event means they have no more sessions
            io.in(socket.userId).clients(function(error, clients) {

                console.log(clients.length);

                if (clients.length == 0) {

                    console.log(socket.userId);

                    if (users[socket.userId]) {
                        delete users[socket.userId];
                    }
                    socket.broadcast.emit('userlist', users);
                    socket.emit('userlist', users);
                }
            });

        })
    });
}