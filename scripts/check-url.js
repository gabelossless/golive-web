const https = require('https');

const url = "https://pub-3460ade86c9d4018be04f796bad3ff79.r2.dev/videos/d7bd695c-84b0-4492-ae51-56f3d62b5c0e/1773442039339_IMG_9024.mov";

https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', () => {}); // consume
}).on('error', (e) => {
  console.error('Error:', e.message);
});
