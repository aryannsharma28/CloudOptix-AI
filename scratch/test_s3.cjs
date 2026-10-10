const http = require('http');

http.get('http://localhost:5000/api/resources', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const s3 = json.data?.filter(r => r.type === 'S3');
      console.log('S3 Buckets in account:', s3);
    } catch(e) {
      console.error(e.message);
    }
  });
}).on('error', console.error);
