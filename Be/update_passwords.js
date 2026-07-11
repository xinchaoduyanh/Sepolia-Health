const { Client } = require('pg');
const bcrypt = require('bcrypt');

const updatePasswords = async () => {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_HipUQw12ohvf@ep-royal-sky-aohuxwtg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Generate hash for "1"
    const hashedPassword = await bcrypt.hash('1', 10);
    console.log('Hash for "1":', hashedPassword);

    // Update all users
    const result = await client.query('UPDATE "User" SET "password" = $1 RETURNING id', [hashedPassword]);
    console.log(`Successfully updated ${result.rowCount} users passwords to "1".`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

updatePasswords();
