var crypto = require('crypto');
var Entities = require('html-entities').AllHtmlEntities;
entities = new Entities();

// list of users available to talk to (one global list for this demo)
var users = {};

module.exports = function (io, socket, msgHandlers, auth) {

    return {
        init: function (data) {

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
        },


        sendMessage: function (data) {
            // check if we're authenticated and authorized to send this message
            if (!(auth.isTokenValid(data.fromId, data.token) && auth.canSendMessage(data.fromId, data.toId))) {
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
                handler.execute(data);
            });

            // send more information about the recipient to the client (i.e. we need at least their name/id)
            data.toUser = users[data.toId];
            data.fromUser = users[data.fromId];

            // escape HTML/XSS protection
            data.message = entities.encode(data.message);

            // send event to the recipient
            socket.to(data.toId).emit('receive message', data);

            // send event to ourself (need to do that so the client can update its UI with any filtered content...)
            socket.emit('receive message', data);
        },


        disconnect: function () {
            // remove the user from the list of "logged in users" this disconnect event means they have no more sessions
            io.in(socket.userId).clients(function (error, clients) {
                if (clients.length == 0) {
                    if (users[socket.userId]) {
                        delete users[socket.userId];
                    }
                    socket.broadcast.emit('userlist', users);
                    socket.emit('userlist', users);
                }
            });
        }
    }
};