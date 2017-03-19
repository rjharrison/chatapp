// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Setup socket.io handlers
var io = require('socket.io')(server);
var setupHandlers = require('./app/socket/handlers');

// Load the desired message handlers (I'm using this as a hacky DI, but this could be configurable and dynamic)
// (See the loop inside "send message" callback)
var msgHandlers = require('../msghandlers').get(['badwords']);
var auth = require('../auth');

io.on('connection', function(socket){
    var handlers = setupHandlers(io, socket, msgHandlers, auth);
    socket.on('init', handlers.init);
    socket.on('send message', handlers.sendMessage);
    socket.on('disconnect', handlers.disconnect);
});


// Routing
app.use(express.static(__dirname + '/public'));
