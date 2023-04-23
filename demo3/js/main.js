'use strict';

import { 
  signalingMessageCallback, createPeerConnection,
} from "./message.js";
import{sendFile} from "./file.js";

var isInitiator;
// var config = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };
var config;
let room = 'WebRTC file sharing';
// window.room = prompt("Enter room name:");


let upload = document.getElementById('loadFile');
var sendBtn = document.getElementById('sendFile');
// var roomURL = document.getElementById('url');
let progressBar = document.querySelector('.progress-bar');

let fileSpeed = document.getElementById('speed');
let fileTime = document.getElementById('time');
var qrCode = document.getElementById('QRcode');


sendBtn.addEventListener('click', sendFile);



//connect to the signaling server
let socket = io.connect();
// if (room !== "") {
//   console.log('Message from client: Asking to join room ' + room);
//   socket.emit('create or join', room);
//   if (location.hostname.match(/localhost|127\.0\.0/)) {
//     socket.emit('ipaddr');
//   }
// }

console.log('Message from client: Asking to join room ' + room);
socket.emit('create or join', room);
socket.emit('ipaddr');


socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
  qrCode.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://" + ipaddr + ":8080";
  //updateRoomURL(ipaddr);
});

socket.on('created', function(room, clientId) {
  isInitiator = true;
});

socket.on('joined', function(room, clientId) {
  isInitiator = false;
  createPeerConnection(isInitiator, config);
});

socket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

socket.on('ready', function() {
  console.log('Socket is ready');
  createPeerConnection(isInitiator, config);
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', function(message) {
  console.log('Client received message:', message);
  signalingMessageCallback(message);
});

socket.on('disconnect', function(reason) {
  console.log(`Disconnected: ${reason}.`);
});

socket.on('bye', function(room) {
  console.log(`Peer leaving room ${room}.`);
  // If peer did not create the room, re-enter to be creator.
  if (!isInitiator) {
    window.location.reload();
  }
});

window.addEventListener('unload', function() {
  console.log(`Unloading window. Notifying peers in ${room}.`);
  socket.emit('bye', room);
});

// let updateRoomURL =function(ipaddr) {
//   var url;
//   if (!ipaddr) {
//     url = location.href;
//   } else {
//     url = location.protocol + '//' + ipaddr + ':2013/#' + room;
//   }
//   roomURL.innerHTML = url;
// }

export {socket, upload, progressBar, fileSpeed, fileTime};