/**
* Send message to signaling server
*/
import {onDataChannelCreated, onJsonChannelCreated} from "./dataChannel.js";
import {socket} from "./main.js";


let sendMessage = function(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}


let peerConn;
let dataChannel;
let jsonChannel;

let signalingMessageCallback = function(message) {
  // body...
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
    

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

let createPeerConnection = function(isInitiator, config) {
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
    jsonChannel = peerConn.createDataChannel('json');
    onDataChannelCreated(dataChannel);
    onJsonChannelCreated(jsonChannel);

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
      if(event.channel.label == 'file'){
        dataChannel = event.channel;
        onDataChannelCreated(dataChannel);
      }
      else if(event.channel.label == 'json'){
        jsonChannel = event.channel;
        onJsonChannelCreated(jsonChannel);
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

let onLocalSessionCreated = function(desc) {
  console.log('local session created:', desc);
  peerConn.setLocalDescription(desc).then(function() {
    console.log('sending local desc:', peerConn.localDescription);
    sendMessage(peerConn.localDescription);
  }).catch(logError);
}

export { 
  signalingMessageCallback, createPeerConnection, 
  peerConn, dataChannel, jsonChannel
};
