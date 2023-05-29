/**
* Send message to signaling server
*/
import {onDataChannelCreated, onJsonChannelCreated, 
  onMessageChannelCreated} from "./dataChannel.js";
import {socket} from "./main.js";

let peerConnArray = new Map();
let peerConn;
let dataChannelArray = new Map();
let jsonChannelArray = new Map();
let messageChannelArray = new Map();
var ondatachannelCount = 0;

let sendMessage = function(message, recvClient, sendClient) {
  socket.emit('log', `sending message ${JSON.stringify(message)}`, socket.id);
  socket.emit('message', message, recvClient, sendClient);
}

let signalingMessageCallback = async function(message, recvClient, sendClient) {
  // body...
  if(peerConnArray.has(recvClient)){
    peerConn = peerConnArray.get(recvClient);
  }
  else{
    return;
  }
  if (message.type === 'offer') {
    socket.emit('log', `Got ${recvClient} offer. Sending answer to peer.`, socket.id);
    await peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                    logError);
    //await peerConn.createAnswer(onLocalSessionCreated, logError);
    await peerConn.createAnswer(
      function(desc) {
        socket.emit('log', `${socket.id} local session created: ${JSON.stringify(desc)}`, socket.id);
        peerConn.setLocalDescription(desc).then(function() {
          sendMessage(peerConn.localDescription, recvClient, sendClient);
        });
      }, logError);
  } else if (message.type === 'answer') {
    socket.emit('log', `${socket.id} Got ${recvClient} answer.`, socket.id);
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

let createPeerConnection = function(isInitiator, clientId, newclientId) {
  // body...
  socket.emit('log', `Creating Peer connection as initiator? ${isInitiator}`, socket.id);
  if(peerConnArray.has(newclientId)){
    peerConn = peerConnArray.get(newclientId);
  }
  else{
    peerConn = new RTCPeerConnection();
    peerConnArray.set(newclientId, peerConn);
  }
  peerConn.onicecandidate = function(event){
    socket.emit('log', `icecandidate event: ${JSON.stringify(event)}`, socket.id);
    if (event.candidate){
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      }, newclientId, clientId);
    }
    else {
      socket.emit('log', 'End of candidates.', socket.id);
    }
  }
  if (isInitiator){
    socket.emit('log', `Creating ${newclientId} Data Channel`, socket.id);
    //file is the channel name
    var dataChannel = peerConn.createDataChannel(newclientId + 'file');
    var jsonChannel = peerConn.createDataChannel(newclientId + 'json');
    var messageChannel = peerConn.createDataChannel(newclientId + 'message');
    onDataChannelCreated(dataChannel);
    onJsonChannelCreated(jsonChannel);
    onMessageChannelCreated(messageChannel);
    dataChannelArray.set(newclientId, dataChannel);
    jsonChannelArray.set(newclientId, jsonChannel);
    messageChannelArray.set(newclientId, messageChannel);

    socket.emit('log', `${socket.id} Creating an offer`, socket.id);
    peerConn.createOffer().then(function(offer) {
      return peerConn.setLocalDescription(offer);
    })
    .then(() => {
      sendMessage(peerConn.localDescription, newclientId, clientId);
    })
    .catch(logError);
  }
  else{
    peerConn.ondatachannel = function(event){
      socket.emit('log', `${newclientId} ondatachannel: ${JSON.stringify(event)}`, socket.id);
      ondatachannelCount += 1;
      if(ondatachannelCount == 2){
        socket.emit('next', newclientId);
        ondatachannelCount = 0;
      }
      var str = event.channel.label;
      if(str.substring(str.length - 4) == 'file'){
        dataChannelArray.set(newclientId, event.channel);
        onDataChannelCreated(event.channel);
      }
      else if(str.substring(str.length - 4) == 'json'){
        jsonChannelArray.set(newclientId, event.channel);
        onJsonChannelCreated(event.channel);
      }
      else if(str.substring(str.length - 7) == 'message'){
        messageChannelArray.set(newclientId, event.channel);
        onMessageChannelCreated(event.channel);
      }
    }
  }
}

let logError = function(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
    socket.emit('err', `${socket.id} has ${err}`, socket.id);
  } else {
    console.warn(err.toString(), err);
    socket.emit('err', `${socket.id} has ${JSON.stringify(err)}`, socket.id);
  }
}



let freeGlobalArray = function(clientId){
  if(dataChannelArray.has(clientId)){
    dataChannelArray.get(clientId).close();
    socket.emit('log', `${clientId} dataChannel is closed`, socket.id);
    dataChannelArray.delete(clientId);
  }
  else if(jsonChannelArray.has(clientId)){
    jsonChannelArray.get(clientId).close();
    socket.emit('log', `${clientId} jsonChannel is closed`, socket.id);
    jsonChannelArray.delete(clientId);
  }
  else if(messageChannelArray.has(clientId)){
    messageChannelArray.get(clientId).close();
    socket.emit('log', `${clientId} messageChannel is closed`, socket.id);
    messageChannelArray.delete(clientId);
  }
  else if(peerConnArray.has(clientId)){
    peerConnArray.get(clientId).close();
    socket.emit('log', `${clientId} peerConnection is closed`, socket.id);
    peerConnArray.delete(clientId);
  }
}

export { 
  createPeerConnection, peerConnArray, signalingMessageCallback,
  dataChannelArray, jsonChannelArray, messageChannelArray, 
  freeGlobalArray
};
