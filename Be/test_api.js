const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8000,
  path: '/api/internal/bridge/doctors/available?date=2026-07-17&serviceId=49&timePreference=morning&clinicId=1',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch(e) {
      console.log(data);
    }
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.end();
