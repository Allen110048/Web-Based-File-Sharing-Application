'use strict';

import { 
  createPeerConnection, freeGlobalArray, 
  signalingMessageCallback} from "./message.js";
import {sendFile} from "./file.js";
import {createSendField, deleteSendField} from "./render.js";
import {buttonListenEvent} from "./button.js";

var isInitiator;
// var config = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };
var config;
let room = 'WebRTC file sharing';
// window.room = prompt("Enter room name:");


// let upload = document.getElementById('loadFile');
// var sendBtn = document.getElementById('sendFile');
// let sendFileBtn = document.querySelector('#sendFile');
// var roomURL = document.getElementById('url');
// let progressBar = document.querySelector('.progress-bar');

// let fileSpeed = document.getElementById('speed');
// let fileTime = document.getElementById('time');
var qrCode = document.getElementById('QRcode');

let clientID = document.getElementById('clientID');

// sendBtn.addEventListener('click', sendFile);

//connect to the signaling server
let socket = io.connect();

console.log('Message from client: Asking to join room ' + room);
socket.emit('create or join', room);
socket.emit('ipaddr');


socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
  qrCode.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://" + ipaddr + ":8080";
});

socket.on('created', function(room, clientId) {
  clientID.innerHTML = clientId;
});

socket.on('joined', function(room, clientId, clientIdArray) {
  clientID.innerHTML = clientId;
  isInitiator = false;
  var index = clientIdArray.indexOf(socket.id);
  if(index !== -1){
    clientIdArray.splice(index,1);
  }
  for(var i = 0; i < clientIdArray.length; i++){
    createPeerConnection(isInitiator, config, clientId, clientIdArray[i]);
    createSendField(clientIdArray[i]);
  }
  buttonListenEvent();
});

socket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

socket.on('ready', function(newClientId) {
  console.log('Socket is ready');
  isInitiator = true;
  createPeerConnection(isInitiator, config, clientID.innerHTML, newClientId);
  // sendFileBtn.parentNode.querySelector('p').textContent = newClientId;
  createSendField(newClientId);
  buttonListenEvent();
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', function(message, recvClient, sendClient) {
  console.log('Client received message:', message);
  signalingMessageCallback(message, recvClient, sendClient);
});

socket.on('disconnect', function(reason) {
  console.log(`Disconnected: ${reason}.`);
});

socket.on('bye', function(room, clientId) {
  console.log(`Peer leaving room ${room}.`);
  freeGlobalArray(clientId);
  deleteSendField(clientId);

});

window.addEventListener('unload', function() {
  console.log(`Unloading window. Notifying peers in ${room}.`);
  socket.emit('bye', room);
});


export {socket, clientID};