import {receiveFile, sendFile, receiveJson} from "./file.js";

let onDataChannelCreated = function(channel){
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function(){
    console.log('data channel opened!');
  }
  channel.onclose = function(){

    console.log('data channel closed!');
  }
  channel.onmessage = receiveFile;
}

let onJsonChannelCreated = function(channel) {
  // body...
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function(){
    console.log('json channel opened!');
  }
  channel.onclose = function(){
    channel.close();
    console.log('json channel closed!');
  }
  channel.onmessage = receiveJson;
}

export {onDataChannelCreated, onJsonChannelCreated};