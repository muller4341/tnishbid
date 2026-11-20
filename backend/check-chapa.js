const https = require('https');

const options = {
  hostname: 'api.chapa.co',
  port: 443,
  path: '/v1/transactions',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer CHASECK-tM93dX4JwoCsV2kKlaXpBVgraUUuhIbM'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Status:', parsed.status);
      console.log('Transactions count:', parsed.data?.transactions?.length);
      const list = parsed.data?.transactions || [];
      list.slice(0, 10).forEach(t => {
        console.log(`[${t.status}] ${t.tx_ref} | Ref: ${t.reference} | ${t.amount} ETB | ${t.created_at}`);
      });
    } catch(e) {
      console.log('Error parsing:', e.message);
    }
  });
});
req.on('error', (e) => console.error(e));
req.end();

