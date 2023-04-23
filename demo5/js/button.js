import {peerConnArray, jsonChannelArray, messageChannelArray} from "./message.js";
import {sendFile} from "./file.js";
import {createFileProgress} from "./render.js";

var count = 0;
var buttons = [];

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
      if(inputs[i].files !== null){
        console.log('inputs[i].files:', inputs[i].files);
        var idType = 'sendProgress';
        var file = inputs[i].files[0];
        var filename = inputs[i].files[0].name;
        messageChannelArray.get(buttons[i].id).send('filename'+filename);

        messageChannelArray.get(buttons[i].id).onmessage = function(event){
          var str = event.data.toString();
          if(str == 'nofile'){
            var json = {
              "name": file.name,
              "size": file.size,
            };
            jsonChannelArray.get(buttons[i].id).send(JSON.stringify(json));
            createFileProgress(filename, idType);
            sendFile(buttons[i].id, file, filename, 0);
          }
          if(str.substring(0,8) == 'filesize'){
            var json = {
              "name": file.name,
              "size": file.size,
            };
            jsonChannelArray.get(buttons[i].id).send(JSON.stringify(json));
            var offset = parseInt(str.substring(8,str.length));
            sendFile(buttons[i].id, file, filename, offset);
          }
        }
        
      }
      else{
        console.log("There is no file in the input", inputs[i], buttons[i]);
      }
    });
  }
}

export {buttonListenEvent};
