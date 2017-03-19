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

io.on('connection', function(socket){
    var handlers = setupHandlers(io, socket);
    socket.on('init', handlers.init);
    socket.on('send message', handlers.sendMessage);
    socket.on('disconnect', handlers.disconnect);
});


// Routing
app.use(express.static(__dirname + '/public'));
