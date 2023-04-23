/**
* Send message to signaling server
*/
import {onDataChannelCreated, onJsonChannelCreated} from "./dataChannel.js";
import {socket} from "./main.js";

let peerConnArray = new Map();
let peerConn;
let dataChannelArray = new Map();
let jsonChannelArray = new Map();
var ondatachannelCount = 0;

let sendMessage = function(message, recvClient, sendClient) {
  console.log(socket.id + ' Client ' + ' sending message: ', message);
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
    console.log(socket.id + ' Got ' + recvClient + ' offer. Sending answer to peer.');
    await peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                    logError);
    //await peerConn.createAnswer(onLocalSessionCreated, logError);
    await peerConn.createAnswer(
      function(desc) {
        console.log(socket.id + ' local session created:', desc);
        peerConn.setLocalDescription(desc).then(function() {
          console.log(socket.id + ' sending local desc:', peerConn.localDescription);
          sendMessage(peerConn.localDescription, recvClient, sendClient);
        });
      }, logError);
  } else if (message.type === 'answer') {
    console.log(socket.id + ' Got ' + recvClient +' answer.');
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

let createPeerConnection = function(isInitiator, config, clientId, newclientId) {
  // body...
  console.log(socket.id + ' Creating Peer connection as initiator?', isInitiator, 
    'config:',config);
  if(peerConnArray.has(newclientId)){
    peerConn = peerConnArray.get(newclientId);
  }
  else{
    peerConn = new RTCPeerConnection();
    peerConnArray.set(newclientId, peerConn);
  }
  peerConn.onicecandidate = function(event){
    console.log(socket.id + ' icecandidate event:', event);
    if (event.candidate){
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      }, newclientId, clientId);
    }
    else {
      console.log('End of candidates.');
    }
  }
  if (isInitiator){
    console.log(socket.id + ' Creating ' + newclientId + ' Data Channel');
    //file is the channel name
    var dataChannel = peerConn.createDataChannel(newclientId + 'file');
    var jsonChannel = peerConn.createDataChannel(newclientId + 'json');
    onDataChannelCreated(dataChannel);
    onJsonChannelCreated(jsonChannel);
    dataChannelArray.set(newclientId, dataChannel);
    jsonChannelArray.set(newclientId, jsonChannel);

    console.log(socket.id + ' Creating an offer');
    peerConn.createOffer().then(function(offer) {
      return peerConn.setLocalDescription(offer);
    })
    .then(() => {
      console.log(socket.id + ' sending ' + newclientId + ' local desc:', peerConn.localDescription);
      sendMessage(peerConn.localDescription, newclientId, clientId);
    })
    .catch(logError);
  }
  else{
    peerConn.ondatachannel = function(event){
      console.log(newclientId + ' ondatachannel:', event.channel);
      ondatachannelCount += 1;
      if(ondatachannelCount == 2){
        console.log('connect next peer', socket.id);
        socket.emit('next', newclientId);
        ondatachannelCount = 0;
      }
      var str = event.channel.label;
      if(str.substring(str.length - 4) == 'file'){
        dataChannelArray.set(newclientId, event.channel);
        var dataChannel = dataChannelArray.get(newclientId);
        onDataChannelCreated(dataChannel);
      }
      else if(str.substring(str.length - 4) == 'json'){
        jsonChannelArray.set(newclientId, event.channel);
        onJsonChannelCreated(event.channel);
      }
    }
  }
}

let logError = function(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}



let freeGlobalArray = function(clientId){
  if(dataChannelArray.has(clientId)){
    dataChannelArray.get(clientId).close();
    dataChannelArray.delete(clientId);
  }
  if(jsonChannelArray.has(clientId)){
    jsonChannelArray.get(clientId).close();
    jsonChannelArray.delete(clientId);
  }
  if(peerConnArray.has(clientId)){
    peerConnArray.get(clientId).close();
    console.log(clientId + ' peerConnection is close');
    peerConnArray.delete(clientId);
  }
}

export { 
  createPeerConnection, peerConnArray, signalingMessageCallback,
  dataChannelArray, jsonChannelArray, freeGlobalArray
};
