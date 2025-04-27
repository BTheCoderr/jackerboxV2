const { Client } = require('pg');

const client = new Client({
  connectionString: "postgres://jackerboxDB_owner:npg_vYM7Pg4ERIAk@ep-fancy-wind-a5ymnajb.us-east-2.aws.neon.tech/jackerboxDB?sslmode=require&connect_timeout=10",
  ssl: {
    rejectUnauthorized: true
  }
});

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Connection successful!', result.rows[0]);
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await client.end();
  }
}

testConnection(); 