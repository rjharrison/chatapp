// Authentication/Authorization
var auth = require('./app/auth');

// Load the desired message handlers (I'm using this as a hacky DI, but this could be configurable and dynamic)
// (See the loop below inside "send message" callback)
var msgHandlers = require('./app/msghandlers').get(['badwords']);

var users = {};

module.exports = function(io) {

    io.on('connection', function(socket){

        /**
         * This event is fired after the client has connected. Perform any setup here.
         */
        socket.on('init', function (data) {
            // Is the token valid for this user? If so, add this socket to the user's "room"
            // - We use this room as a channel for any events directed at this user, allowing him to have multiple sockets attached
            // - Also allows us to send messages to a user without knowing what his socket.id's are
            if (auth.isTokenValid(data.userId, data.token)) {
                socket.join(data.userId);
                socket.userId = data.userId;

                // update the userlist (and broadcast it to everyone - not suitable for production but works for this POC)
                if (!users[data.userId]) {
                    users[data.userId] = true;
                    socket.broadcast.emit('userlist', users);
                    socket.emit('userlist', users);
                }
            }
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
                if (clients.length == 0) {
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