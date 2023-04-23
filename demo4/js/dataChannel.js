import {receiveFile, sendFile, receiveJson, recv_count} from "./file.js";
import {createFileProgress} from './render.js';

var startTime;

let onDataChannelCreated = function(channel){
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function(){
    console.log(channel.label + ' channel opened!');
  }
  channel.onclose = function(){
    channel.close();
    console.log(channel.label + ' channel closed!');
  }
  channel.onmessage = function(event){
    if(recv_count == 0){
      startTime = new Date().getTime();
    }
    receiveFile(event, startTime);
  }
}

let onJsonChannelCreated = function(channel) {
  // body...
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function(){
    console.log(channel.label +' channel opened!');
  }
  channel.onclose = function(){
    channel.close();
    console.log(channel.label + ' channel closed!');
  }
  channel.onmessage = function(event){
    var jsonFile = JSON.parse(event.data.toString());
    var idType = 'recvProgress';
    receiveJson(event);
    createFileProgress(jsonFile.name, idType);
  }
}

export {onDataChannelCreated, onJsonChannelCreated, recv_count};