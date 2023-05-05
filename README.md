# Web-Based-File-Sharing-Application

install node.js and npm
open cmd
install environment
```
npm install
```
run command
```
node index.js
```
open browser and input
```
http://address:port
```
address is the server IP address<br>
port is in the index.js
```
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(port);
```
