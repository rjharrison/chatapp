// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// sets up the socket.io listeners
require('./app/socket')(server);

// Routing
app.use(express.static(__dirname + '/public'));
