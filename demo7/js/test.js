const puppeteer = require('puppeteer');
const { enumerateDevices } = require('webrtc-ips');
const wrtc = require('wrtc');

describe('WebRTC connection tests', () => {
  let browser, page, server, port;

  beforeAll(async () => {
    // 启动 HTTP 服务器
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

    // 启动 Puppeteer
    browser = await puppeteer.launch();
    page = await browser.newPage();

    // 模拟不同的网络环境
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
    // 关闭 HTTP 服务器
    server.close();

    // 关闭 Puppeteer
    await browser.close();
  });

  test('WebRTC connection works', async () => {
    // 导航到测试页面
    await page.goto(`http://localhost:${port}`);

    // 等待页面加载完成
    await page.waitForSelector('#clientID');

    // 创建 RTCPeerConnection 对象
    const pc1 = new wrtc.RTCPeerConnection();

    // 创建 RTCDataChannel 对象
    const dc1 = pc1.createDataChannel('test-channel');
    dc1.onmessage = event => {
      console.log('Received message:', event.data);
    };

    // 创建 offer
    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);

    // 将 offer 发送到对等端
    const offerString = JSON.stringify(offer);
    await page.evaluate(`handleOffer(${offerString})`);

    // 等待 answer
    const answerString = await page.evaluate(`waitForAnswer()`);
    const answer = JSON.parse(answerString);
    await pc1.setRemoteDescription(answer);

    // 等待连接完成
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

    // 发送消息到对等端
    dc1.send('Hello, world!');

    // 等待接收到对等端发送的消息
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

  // 断开连接
  pc1.close();
  });
});