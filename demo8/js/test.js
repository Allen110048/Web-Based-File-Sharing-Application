const puppeteer = require('puppeteer');
const { enumerateDevices } = require('webrtc-ips');
const wrtc = require('wrtc');

describe('WebRTC connection tests', () => {
  let browser, page, server, port;

  beforeAll(async () => {
    // open HTTP server
    server = require('http').createServer((req, res) => {
      const file = req.url === '/' ? '/index.html' : req.url;
      const path = require('path').join(__dirname, 'public', file);
      require('fs').readFile(path, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end(`Error loading ${file}`);
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    });
    await new Promise(resolve => {
      server.listen(() => {
        port = server.address().port;
        resolve();
      });
    });

    // open Puppeteer
    browser = await puppeteer.launch();
    page = await browser.newPage();

    // Simulate different network environments
    const ips = await enumerateDevices();
    const localIp = ips.find(ip => ip.ipAddress.startsWith('192.168.'));

    await page.emulateNetworkConditions({
      offline: false,
      latency: 40,
      downloadThroughput: 2000 * 1024 / 8,
      uploadThroughput: 2000 * 1024 / 8,
      ...localIp
    });
  });

  afterAll(async () => {
    // close HTTP server
    server.close();

    // close Puppeteer
    await browser.close();
  });

  test('WebRTC connection works', async () => {
    // Navigate to the test page
    await page.goto(`http://localhost:${port}`);

    // Wait for the page to finish loading
    await page.waitForSelector('#clientID');

    // Create RTCPeerConnection object
    const pc1 = new wrtc.RTCPeerConnection();

    // create RTCDataChannel object
    const dc1 = pc1.createDataChannel('test-channel');
    dc1.onmessage = event => {
      console.log('Received message:', event.data);
    };

    // create offer
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);

    // send offer
    const offerString = JSON.stringify(offer);
    await page.evaluate(`handleOffer(${offerString})`);

    // wait for answer
    const answerString = await page.evaluate(`waitForAnswer()`);
    const answer = JSON.parse(answerString);
    await pc1.setRemoteDescription(answer);

    // Wait for connection to complete
    await new Promise(resolve => {
      const checkConnectionState = () => {
        if (pc1.iceConnectionState === 'connected') {
          resolve();
          console.log('P2P connection has been established');
        } else {
          setTimeout(checkConnectionState, 100);
        }
      };
      checkConnectionState();
    });

    // send message
    dc1.send('Hello, world!');

    // wait for message
    await new Promise(resolve => {
      const checkMessageReceived = () => {
        if (receivedMessage === 'Hello, world!') {
          resolve();
          console.log('RTCDataChannel connected sucessfully');
        } else {
          setTimeout(checkMessageReceived, 100);
        }
      };
      checkMessageReceived();
    });

  // close connection
  pc1.close();
  });
});