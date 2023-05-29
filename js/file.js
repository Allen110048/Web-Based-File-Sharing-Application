import {peerConnArray, dataChannelArray, jsonChannelArray} from "./message.js";
import {renderProgress} from "./render.js";
import {fileChunks} from "./dataChannel.js";
import {checkFileHash} from "./checkFile.js";
import {socket} from "./main.js";

let recv_count = 0;
var fileLength = 0;
var count = 0;

let receiveFile = function(event, startTime) {
  // body...
  var fileChunk = fileChunks.get(jsonFile.name);
  var end = event.data.toString();
  if(end == 'Done!'){
    // Once, all the chunks are received, combine them to form a Blob
    const file = new Blob(fileChunk);
    var checkIntegrity = checkFileHash(file, jsonFile.hash);
    if(checkIntegrity){
      console.log('Received', file);
      socket.emit('log', `Received ${JSON.stringify(file)}`, socket.id);
      // Download the received file using downloadjs
      if(jsonFile.num > 1){
        var zip = new JSZip();
        zip.loadAsync(file).then(function(zip){
          var files = Object.keys(zip.files);
          var fileName = [];

          for(var i = 0; i < files.length; i++){
            var newfile = zip.files[files[i]];
            console.log('newfile', newfile);
            fileName.push(newfile.name);
            var fileType = newfile.type;
            newfile.async('arraybuffer').then(function(data){
              var fileData = new File([data], fileName.pop(), fileType);
              console.log('fileData', fileData);
              download(fileData, fileData.name);
            });
          }
        });
      }
      else{
        download(file, jsonFile.name);
      }
    }
    else{
      alert(jsonFile.name + "is incomplete");
    }
    fileChunks.delete(jsonFile.name);
    recv_count = 0;
    fileLength = 0;
    count = 0;
  }
  else{
    // Keep appending various file chunks 
    fileChunk.push(event.data);
    var message = `chunk ${count} is recieved`;
    count++;
    socket.emit('chunk', message, socket.id);
    var idType = 'recvProgress';
    fileLength += event.data.byteLength;
    renderProgress(fileLength, jsonFile.size, startTime, jsonFile.name, idType);
    recv_count++;
  }
}

var jsonFile;
let receiveJson = function(event){
  jsonFile = JSON.parse(event.data.toString());
  console.log(jsonFile);
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