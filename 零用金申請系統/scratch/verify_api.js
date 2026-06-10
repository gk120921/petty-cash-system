const axios = require('axios');

async function verify() {
  const base = 'http://localhost:3000/api';
  console.log('--- Verifying API Endpoints ---');

  try {
    const configRes = await axios.get(`${base}/config`);
    console.log('✅ /api/config: Success', configRes.data);
  } catch (e) { console.error('❌ /api/config: Failed', e.message); }

  try {
    const expensesRes = await axios.get(`${base}/expenses?is_archived=false`);
    console.log('✅ /api/expenses: Success, count:', expensesRes.data.length);
  } catch (e) { console.error('❌ /api/expenses: Failed', e.message); }

  try {
    const categoriesRes = await axios.get(`${base}/categories`);
    console.log('✅ /api/categories: Success, count:', categoriesRes.data.length);
  } catch (e) { console.error('❌ /api/categories: Failed', e.message); }

  console.log('--- Verification Complete ---');
  process.exit(0);
}

verify();
