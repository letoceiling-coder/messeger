const http = require('http');
const data = JSON.stringify({ phone: '+79897625658' });
const req = http.request({
  hostname: '127.0.0.1',
  port: 30000,
  path: '/api/auth/send-code',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log(res.statusCode, b));
});
req.write(data);
req.end();
