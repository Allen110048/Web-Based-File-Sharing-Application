import {upload, probg, progress, percentInfo} from "./main.js";
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
var file_chunk;
var index = 0;
let sendFile = async function (){
  var file = upload.files[0];
  console.log('Sending', file);
  let offset = 0;
  let buffer = null;
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
      "index": index
    };
    index += 1;
    jsonChannel.send(JSON.stringify(json));
    percent = Math.round(offset / file.size * 100);
    probg.style.width = progress.Width / 100 * percent + "px";
    percentInfo.innerHTML = "upload progress: "+ percent + "%";
  }
  dataChannel.send('Done!');
}



export {receiveFile, sendFile, receiveJson};