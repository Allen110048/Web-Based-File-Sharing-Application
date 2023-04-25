let getFileHash = async function(file) {
	const buffer = await file.arrayBuffer();
	const hash = await crypto.subtle.digest('SHA-256', buffer);
	const hashArray = Array.from(new Uint8Array(hash));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

let checkFileHash = function(newfile, fileHash){
	return getFileHash(newfile).then(newfileHash => {
		if(fileHash === newfileHash){
			return true;
		}
		else{
			return false;
		}
	});
}

export {getFileHash, checkFileHash};