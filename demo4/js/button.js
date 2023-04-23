import {peerConnArray} from "./message.js";
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

  console.log('buttons:', buttons);
  console.log('inputs:', inputs);

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function(){
      console.log('addEventListener id', buttons[i]);
      if(inputs[i].files !== null)
        console.log("files:", inputs[i].files);
        var idType = 'sendProgress';
        var filename = inputs[i].files[0].name;
        createFileProgress(filename, idType);
        sendFile(buttons[i].id, inputs[i].files[0], filename);
    });
  }
}

export {buttonListenEvent};
