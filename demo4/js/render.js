let createSendField = function(clientId){
  const sendField = document.querySelector('#sendField');

  const newCol = document.createElement('div');
  newCol.classList.add('col-md-3');
  newCol.setAttribute('id', clientId);
  newCol.style.paddingTop = '12px';
  newCol.style.paddingBottom = '12px';
  newCol.style.paddingLeft = '12px';
  newCol.style.paddingRight = '12px';

  const newBgLight = document.createElement('div');
  newBgLight.classList.add('bg-light');
  newBgLight.setAttribute('id', 'color');

  const newUsername = document.createElement('p');

  newUsername.textContent = clientId;

  const newInput = document.createElement('input');
  newInput.setAttribute('type', 'file');
  newInput.setAttribute('id', clientId);
  newInput.classList.add('form-control', 'mb-3');

  const newButton = document.createElement("button");
  // newButton.classList.add('btn\u0020btn-primary');
  newButton.setAttribute('class', 'btn btn-primary');
  newButton.setAttribute('id', clientId);
  newButton.textContent = "Send";

  newBgLight.appendChild(newUsername);
  newBgLight.appendChild(newInput);
  newBgLight.appendChild(newButton);

  newCol.appendChild(newBgLight);
  sendField.appendChild(newCol);
}

let createFileProgress = function(filename, idType){
  const fileProgress = document.querySelector('#'+idType);

  var newDiv1 = document.createElement('div');

  const newFilename = document.createElement('p');
  newFilename.textContent = filename;

  const progress = document.createElement('div');
  progress.setAttribute('class', 'progress mt-3');

  const progressBar = document.createElement('div');
  progressBar.classList.add('progress-bar');
  progressBar.setAttribute('role', 'progressBar');
  progressBar.style.width = '0%';
  progressBar.setAttribute('aria-valuenow', '0');
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');

  progress.appendChild(progressBar);

  const newRow1 = document.createElement('div');
  newRow1.classList.add('row');

  const newCol2 = document.createElement('div');
  newCol2.setAttribute('class', 'col-sm-8 col-md-12');

  const newRow2 = document.createElement('div');
  newRow2.classList.add('row');

  const newCol3 = document.createElement('div');
  newCol3.classList.add('col-6');

  const speed = document.createElement('span');
  speed.setAttribute('id', 'speed');

  const newCol4 = document.createElement('div');
  newCol4.setAttribute('class', 'col-6 text-end');

  const time = document.createElement('span');
  time.setAttribute('id', 'time');

  newCol4.appendChild(time);
  newCol3.appendChild(speed);
  newRow2.appendChild(newCol3);
  newRow2.appendChild(newCol4);
  
  newCol2.appendChild(newRow2);
  newRow1.appendChild(newCol2);

  newDiv1.appendChild(newFilename);
  newDiv1.appendChild(progress);
  newDiv1.appendChild(newRow1);

  fileProgress.appendChild(newDiv1);
}

let deleteSendField = function(clientId){
  const sendField = document.querySelector('#'+clientId);
  if(sendField != null){
    const newBgLight = sendField.querySelector('#color');
    const text = newBgLight.querySelector('p');
    const newInput = newBgLight.querySelector('input');
    const newButton = newBgLight.querySelector('button');

    text.remove();
    newInput.remove();
    newButton.remove();
    newBgLight.remove();
    newButton.remove();
  }
  else{
    console.log('sendField is null', sendField, clientId);
  }
  
}

export {createFileProgress, deleteSendField, createSendField};