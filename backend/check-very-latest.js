const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { chapaRequest, getConfig, CHAPA_VERIFY_URL } = require('./src/controllers/chapaController');

async function main() {
  const res = await chapaRequest('https://api.chapa.co/v1/transactions', { method: 'GET' });
  const txs = res.data?.transactions || res.data || [];

  console.log(`Checking latest 5 transactions on Chapa:`);
  for (const t of txs.slice(0, 5)) {
    try {
      const v = await chapaRequest(`${CHAPA_VERIFY_URL}/${t.ref_id}`, { method: 'GET' });
      console.log(`\n-----------------------------------------`);
      console.log(`RefID: ${t.ref_id}`);
      console.log(`tx_ref: ${v.data?.tx_ref}`);
      console.log(`Amount: ${v.data?.amount} | Status: ${v.data?.status}`);
      console.log(`User: ${v.data?.first_name} ${v.data?.last_name} (${v.data?.phone_number})`);
      console.log(`Created: ${v.data?.created_at}`);
    } catch (e) {
      console.log(`RefID: ${t.ref_id} error:`, e.message);
    }
  }
}

main();

