import {peerConnArray, jsonChannelArray, messageChannelArray} from "./message.js";
import {sendFile} from "./file.js";
import {createFileProgress} from "./render.js";
import {getFileHash} from "./checkFile.js";

var count = 0;
var buttons = [];
var file;

let buttonListenEvent = function(){
  if(buttons.length > 0){
    buttons.forEach(button => {
      const clonedButton = button.cloneNode(true);
      button.parentNode.replaceChild(clonedButton, button);
    });
    buttons = [];
  }
  buttons = document.querySelectorAll("#sendField button");
  const inputs = document.querySelectorAll("#sendField input");

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function(){
      if(inputs[i].files.length !== 0){
        if(inputs[i].files.length > 1){
          var zip = new JSZip();
          for(var j = 0; j < inputs[i].files.length; j++){
            zip.file(inputs[i].files[j].name, inputs[i].files[j]);
          }
          zip.generateAsync({type: "blob"}).then(blob => {
            console.log('blob', blob);
            var currentTime = new Date().getTime();
            file = new File([blob], `${currentTime}.zip`, {type: blob.type});
            console.log('zip:', file);
            buttonListenMessage(file, buttons[i].id);
          });
        }
        else{
          file = inputs[i].files[0];
          buttonListenMessage(file, buttons[i].id);
        }
      }
    });
  }
}

let buttonListenMessage = function(file, id){
  var idType = 'sendProgress';
  var filename = file.name;
  messageChannelArray.get(id).send('filename'+filename);
  messageChannelArray.get(id).onmessage = function(event){
    var str = event.data.toString();
    getFileHash(file).then(fileHash => {
      if(str == 'nofile'){
        var json = {
          "name": file.name,
          "size": file.size,
          "hash": fileHash,
        };
        jsonChannelArray.get(id).send(JSON.stringify(json));
        createFileProgress(filename, idType);
        sendFile(id, file, filename, 0);
      }
      if(str.substring(0,8) == 'filesize'){
        var json = {
          "name": file.name,
          "size": file.size,
          "hash": fileHash,
        };
        jsonChannelArray.get(id).send(JSON.stringify(json));
        var offset = parseInt(str.substring(8,str.length));
        sendFile(id, file, filename, offset);
      }
    });
  }
}

export {buttonListenEvent};
