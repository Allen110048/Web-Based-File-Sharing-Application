'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
var fs = require('fs');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8096);

var io = socketIO.listen(app);
var userIdArray = []
var userSqueue = 0;
io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function Log(filename, clientId, message) {
    const now = new Date();
    const dateAndTime = now.toLocaleString();
    var array = [`Message from ${clientId}:`];
    array.push(message);
    array.push('\n');
    const content = `${dateAndTime}: ${array.join(' ')}`;
    fs.writeFile(`log/${filename}`, content, {flag:"a+"}, function(err){
      if (err) throw err;
    });
  }

  socket.on('log', function(message, clientId){
    Log('Client.log', clientId, message);
  });

  socket.on('error', function(message, clientId){
    Log('Error.log', clientId, message);
  });

  socket.on('message', function(message, recvClient, sendClient) {
    io.to(recvClient).emit('message', message, sendClient, recvClient);
  });

  socket.on('next', function(clientId){
    var rankNum = userIdArray.indexOf(clientId) + 1;
    if(rankNum !== userIdArray.length - 1){
      io.to(userIdArray[rankNum]).emit('ready', socket.id);
    }
  });

  socket.on('create or join', function(room) {
    userIdArray.push(socket.id);
    Log('System.log', 'server', `Received request to create or join room $room`);
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    Log('System.log', 'server', `Room ${room} now has ${numClients} client(s)`);

    if (numClients === 0) {
      socket.join(room);
      Log('System.log', 'server', `Client ID ${socket.id} created room ${room}`);
      socket.emit('created', room, socket.id);

    } else if (numClients >= 1) {
      Log('System.log', 'server', `Client ID ${socket.id} joined room ${room}`);
      socket.join(room);
      socket.emit('joined', room, socket.id, userIdArray);
      io.to(userIdArray[0]).emit('ready', socket.id);
    }
  });
 
  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1' && dev == 'WLAN') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('disconnect', function(reason){
    Log('System.log', 'server', `Peer or server disconnected. Reason: ${reason}.`);
  });

  socket.on('bye', function(room) {
    socket.broadcast.emit('bye', room, socket.id);
    var index = userIdArray.indexOf(socket.id);
    if(index !== -1){
      userIdArray.splice(index,1);
    }
    Log('System.log', 'server', `Peer ${socket.id} said bye on room ${room}.`);
  });

});


