require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: 'jackerboxDB_owner',
  password: 'npg_vYM7Pg4ERIAk',
  host: 'ep-shy-meadow-a58922m9.us-east-2.aws.neon.tech',
  database: 'jackerboxDB',
  port: 5432,
  ssl: {
    rejectUnauthorized: true
  },
  keepAlive: true,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000
});

async function testConnection() {
  try {
    console.log('Testing connection to Neon...');
    await client.connect();
    console.log('Connected! Testing simple query...');
    const result = await client.query('SELECT current_database() as db_name');
    console.log('Success! Connected to database:', result.rows[0].db_name);
  } catch (error) {
    console.error('Connection error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await client.end().catch(console.error);
  }
}

testConnection(); 