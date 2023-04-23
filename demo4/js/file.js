import {peerConnArray, dataChannelArray, jsonChannelArray} from "./message.js";

var fileChunks = [];
let recv_count = 0;
var fileLength = 0;

let receiveFile = function(event, startTime) {
  // body...
  var end = event.data.toString();
  if(end == 'Done!'){
    // Once, all the chunks are received, combine them to form a Blob
      const file = new Blob(fileChunks);

    console.log('Received', file);
    // Download the received file using downloadjs
    download(file, jsonFile.name);
    fileChunks = [];
    recv_count = 0;
    fileLength = 0;
  }
  else{
    // Keep appending various file chunks 
    fileChunks.push(event.data);
    var idType = 'recvProgress';
    fileLength += event.data.byteLength;
    // console.log('event.data', event.data);
    // console.log('fileLength:', fileLength);
    renderProgress(fileLength, jsonFile.size, startTime, jsonFile.name, idType);
    recv_count++;
  }
}

var jsonFile;
let receiveJson = function(event){
  jsonFile = JSON.parse(event.data.toString());
}

// var index = 0;
let sendFile = async function (clientId, file, filename){
  console.log('Sending', file);
  let offset = 0;
  let buffer = null;
  var speed = 0;
  var startTime = new Date().getTime();
  const chunkSize = peerConnArray.get(clientId).sctp.maxMessageSize;

  var dataChannel = dataChannelArray.get(clientId);
  var jsonChannel = jsonChannelArray.get(clientId);

  var json = {
    "name": file.name,
    "size": file.size,
  };
  jsonChannel.send(JSON.stringify(json));

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

let renderProgress = function(currentLength, length, startTime, filename, idType){
  var percent = Math.round(currentLength / length * 100);
  var currentTime = new Date().getTime();
  var passTime = (currentTime - startTime) / 1000;
  var remainTime = Math.round((100 - percent) * (passTime / percent));
  var speed = Math.round(currentLength / (passTime * 1024 * 1024));

  var sendProgress = document.querySelector('#'+idType);
  var sendIdFile = sendProgress.querySelectorAll('p');
  var parentTag;
  sendIdFile.forEach(element => {
    if(element.textContent.includes(filename)){
      parentTag = element.parentNode;
    }
  });

  var progressBar = parentTag.querySelector('.progress-bar');
  var fileSpeed = parentTag.querySelector('#speed');
  var fileTime = parentTag.querySelector('#time');

  progressBar.style.width = percent + '%';
  fileSpeed.innerHTML = "Speed: " + speed + " MB/s";
  fileTime.innerHTML = "Time: " + remainTime + " S";
}


export {receiveFile, sendFile, receiveJson, recv_count};