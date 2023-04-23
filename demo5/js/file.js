import {peerConnArray, dataChannelArray, jsonChannelArray} from "./message.js";
import {renderProgress} from "./render.js";
import {fileChunks} from "./dataChannel.js";

let recv_count = 0;
var fileLength = 0;

let receiveFile = function(event, startTime) {
  // body...
  var fileChunk = fileChunks.get(jsonFile.name);
  var end = event.data.toString();
  if(end == 'Done!'){
    // Once, all the chunks are received, combine them to form a Blob
      const file = new Blob(fileChunk);

    console.log('Received', file);
    // Download the received file using downloadjs
    download(file, jsonFile.name);
    
    fileChunks.delete(jsonFile.name);
    recv_count = 0;
    fileLength = 0;
  }
  else{
    // Keep appending various file chunks 
    fileChunk.push(event.data);
    var idType = 'recvProgress';
    fileLength += event.data.byteLength;
    renderProgress(fileLength, jsonFile.size, startTime, jsonFile.name, idType);
    recv_count++;
  }
}

var jsonFile;
let receiveJson = function(event){
  jsonFile = JSON.parse(event.data.toString());
}

// var index = 0;
let sendFile = async function (clientId, file, filename, offset){
  console.log('Sending', file);
  let buffer = null;
  var speed = 0;
  var startTime = new Date().getTime();
  const chunkSize = peerConnArray.get(clientId).sctp.maxMessageSize;

  var dataChannel = dataChannelArray.get(clientId);
  var jsonChannel = jsonChannelArray.get(clientId);

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
    var idType = 'sendProgress';
    renderProgress(offset, file.size, startTime, filename, idType);
    dataChannel.send(buffer);
    offset += buffer.byteLength;
  }
  dataChannel.send('Done!');
}

export {receiveFile, sendFile, receiveJson, recv_count};