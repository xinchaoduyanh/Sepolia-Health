const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_HipUQw12ohvf@ep-royal-sky-aohuxwtg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});
client.connect().then(() => {
  return client.query('SELECT "userMessage", "aiMessage", "createdAt" FROM "AiTurn" ORDER BY "createdAt" DESC LIMIT 6');
}).then(res => {
  console.log('Latest Chat Messages:');
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}).catch(err => {
  console.error('Error:', err);
  client.end();
});
