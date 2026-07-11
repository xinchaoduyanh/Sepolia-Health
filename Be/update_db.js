const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_HipUQw12ohvf@ep-royal-sky-aohuxwtg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});
client.connect().then(() => {
  return client.query(`UPDATE "Promotion" SET "validTo" = '2027-02-14T17:00:00.000Z' WHERE code = 'TET2026' RETURNING *`);
}).then(res => {
  console.log('Updated Promotion:', res.rows[0]);
  client.end();
}).catch(err => {
  console.error('Error:', err);
  client.end();
});
