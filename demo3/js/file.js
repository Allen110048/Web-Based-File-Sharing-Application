import {upload, progressBar, fileTime, fileSpeed} from "./main.js";
import {peerConn, dataChannel, jsonChannel} from "./message.js";

var fileChunks = [];
let receiveFile = function(event) {
  // body...
  var end = event.data.toString();
  if(end == 'Done!'){
    // Once, all the chunks are received, combine them to form a Blob
      const file = new Blob(fileChunks);

    console.log('Received', file);
    // Download the received file using downloadjs
    download(file, jsonFile.name);
    fileChunks = [];
  }
  else{
    // Keep appending various file chunks 
    fileChunks.push(event.data);
  }
}

var jsonFile;
let receiveJson = function(event){
  jsonFile = JSON.parse(event.data.toString());
  console.log(jsonFile);
}

var percent = 0;
// var index = 0;
let sendFile = async function (){
  var file = upload.files[0];
  console.log('Sending', file);
  let offset = 0;
  let buffer = null;
  var speed = 0;
  var startTime = new Date().getTime();
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
    var json = {
      "name": file.name,
      // "index": index
    };
    // index += 1;
    jsonChannel.send(JSON.stringify(json));
    percent = Math.round(offset / file.size * 100);
    var currentTime = new Date().getTime();
    var passTime = (currentTime - startTime) / 1000;
    var remainTime = Math.round((100 - percent) * (passTime / percent));
    speed = Math.round(file.size / (passTime * 1024 * 1024));

    progressBar.style.width = percent + '%';
    fileSpeed.innerHTML = "Speed: " + speed + " MB/s";
    fileTime.innerHTML = "Time: " + remainTime + " S";

    // probg.style.width = progress.Width / 100 * percent + "px";
    // percentInfo.innerHTML = "upload progress: "+ percent + "%";

  }
  dataChannel.send('Done!');
}



export {receiveFile, sendFile, receiveJson};