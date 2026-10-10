const http = require('http');

http.get('http://localhost:5000/api/recommendations', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response body:', data);
  });
}).on('error', console.error);
