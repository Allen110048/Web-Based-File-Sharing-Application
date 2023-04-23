import {receiveFile, sendFile, receiveJson, recv_count} from "./file.js";
import {createFileProgress} from './render.js';
import {socket} from './main.js';

var startTime;
let fileChunks = new Map();
let offset;

let onDataChannelCreated = function(channel){
  socket.emit('log', `onDataChannelCreated: ${JSON.stringify(channel)}`, socket.id);
  channel.onopen = function(){
    socket.emit('log', `${channel.label} channel opened!`, socket.id);
  }
  channel.onclose = function(){
    channel.close();
    socket.emit('log', `${channel.label} channel opened!`, socket.id);
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
  socket.emit('log', `onJsonChannelCreated: ${JSON.stringify(channel)}`, socket.id);
  channel.onopen = function(){
    socket.emit('log', `${channel.label} channel opened!`, socket.id);
  }
  channel.onclose = function(){
    channel.close();
    socket.emit('log', `${channel.label} channel closed!`, socket.id);
  }
  channel.onmessage = function(event){
    var jsonFile = JSON.parse(event.data.toString());
    var idType = 'recvProgress';
    receiveJson(event);

    var fileChunksKey =  Array.from(fileChunks.keys());
    if(fileChunksKey.indexOf(jsonFile.name) === -1){
      var filechunk = [];
      fileChunks.set(jsonFile.name, filechunk);
      createFileProgress(jsonFile.name, idType);
    }
  }
}

let onMessageChannelCreated = function(channel){
  socket.emit('log', `onMessageChannelCreated: ${JSON.stringify(channel)}`, socket.id);
  channel.onopen = function(){
    socket.emit('log', `${channel.label} channel opened!`, socket.id);
  }
  channel.onclose = function(){
    channel.close();
    socket.emit('log', `${channel.label} channel closed!`, socket.id);
  }
  channel.onmessage = function(event){
    var str = event.data.toString();
    if(str.substring(0,8) == 'filename'){
      var filename = str.substring(8, str.length);
      var fileChunksKey = Array.from(fileChunks.keys());

      if(fileChunksKey.indexOf(filename) !== -1){
        var fileChunk = fileChunks.get(filename);
        var filesize = 0;
        for(var i = 0; i < fileChunk.length; i++){
          filesize += fileChunk[i].byteLength;
        }
        channel.send('filesize' + filesize);
      }
      else{
        socket.emit('log', `The key is not existed ${filename}`, socket.id);
        channel.send('nofile');
      }
    }
  }
}

export {onDataChannelCreated, onJsonChannelCreated, 
  onMessageChannelCreated, recv_count, fileChunks};