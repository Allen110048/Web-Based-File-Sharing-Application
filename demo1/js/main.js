'use strict';

var isInitiator;
var config = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

window.room = prompt("Enter room name:");


var upload = document.getElementById('loadFile');
var sendBtn = document.getElementById('sendFile');
var roomURL = document.getElementById('url');

var progress = document.getElementById('progress');
var percentInfo = document.getElementById('percent');
var probg = document.getElementById('probg');

sendBtn.addEventListener('click', sendFile);

//connect to the signaling server
var socket = io.connect();
if (room !== "") {
  console.log('Message from client: Asking to join room ' + room);
  socket.emit('create or join', room);
  if (location.hostname.match(/localhost|127\.0\.0/)) {
    socket.emit('ipaddr');
  }
}

socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
  updateRoomURL(ipaddr);
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

/**
* Send message to signaling server
*/
function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

function updateRoomURL(ipaddr) {
  var url;
  if (!ipaddr) {
    url = location.href;
  } else {
    url = location.protocol + '//' + ipaddr + ':2013/#' + room;
  }
  roomURL.innerHTML = url;
}

var peerConn;
var dataChannel;

function signalingMessageCallback(message) {
  // body...
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);

  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate,
      sdpMLineIndex: message.label,
      sdpMid: message.id
    }));
    
  }
}

function createPeerConnection(isInitiator, config) {
  // body...
  console.log('Creating Peer connection as initiator?', isInitiator, 
    'config:',config);
  peerConn = new RTCPeerConnection(config);

  // send any ice candidates to the other peer
  peerConn.onicecandidate = function(event){
    console.log('icecandidate event:', event);
    if (event.candidate){
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    }
    else {
      console.log('End of candidates.');
    }
  }

  if (isInitiator){
    console.log('Creating Data Channel');
    //file is the channel name
    dataChannel = peerConn.createDataChannel('file');
    onDataChannelCreated(dataChannel);

    console.log('Creating an offer');
    peerConn.createOffer().then(function(offer) {
      return peerConn.setLocalDescription(offer);
    })
    .then(() => {
      console.log('sending local desc:', peerConn.localDescription);
      sendMessage(peerConn.localDescription);
    })
    .catch(logError);
  }
  else{
    peerConn.ondatachannel = function(event){
      console.log('ondatachannel:', event.channel);
      dataChannel = event.channel;
      onDataChannelCreated(dataChannel);
    }
  }
}

function onDataChannelCreated(channel){
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function(){
    console.log('channel opened!');
  }
  channel.onclose = function(){
    console.log('channel closed!');
  }
  channel.onmessage = receiveFile;
}

var fileChunks = [];
function receiveFile(event) {
  // body...
  var string = event.data.toString();
  var end = string.substring(0, 5);
  var fileName = string.substring(5, string.length);
  if(end == 'Done!'){
    // Once, all the chunks are received, combine them to form a Blob
      const file = new Blob(fileChunks);

    console.log('Received', file);
    // Download the received file using downloadjs
    download(file, fileName);
  }
  else{
    // Keep appending various file chunks 
    fileChunks.push(event.data);
  }
}

// function sendFile(){
//   var file = upload.files[0];
//   console.log('Sending', file);
//   file.arrayBuffer().then(buffer => {
//     const chunkSize = 65535;
//     // dataChannel.send(buffer.byteLength);

//     while(buffer.byteLength){
//        var chunk = buffer.slice(0, chunkSize);
//        buffer = buffer.slice(chunkSize, buffer.byteLength);
//        dataChannel.send(chunk);
//     }
//     dataChannel.send('Done!' + file.name);
//   });
// }
var percent= 0;
var file_chunk;
async function sendFile(){
  var file = upload.files[0];
  console.log('Sending', file);
  let offset = 0;
  let buffer = null;
  const chunkSize = peerConn.sctp.maxMessageSize;

  while(offset < file.size){
    const slice = file.slice(offset, offset + chunkSize);
    buffer = await slice.arrayBuffer();
    if(dataChannel.bufferedAmount > 65535){
      await new Promise(resolve => {
        dataChannel.onbufferedamountlow = (ev) => {
          console.log("bufferedamountlow event! bufferedAmount: " 
            + dataChannel.bufferedAmount);
        resolve(0);
        }
      });
    }

    offset += buffer.byteLength;
    dataChannel.send(buffer);

    percent = Math.round(offset / file.size * 100);
    probg.style.width = progress.Width / 100 * percent + "px";
    percentInfo.innerHTML = "upload progress: "+ percent + "%";
  }
  dataChannel.send('Done!' + file.name);
}

function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}

function onLocalSessionCreated(desc) {
  console.log('local session created:', desc);
  peerConn.setLocalDescription(desc).then(function() {
    console.log('sending local desc:', peerConn.localDescription);
    sendMessage(peerConn.localDescription);
  }).catch(logError);
}
