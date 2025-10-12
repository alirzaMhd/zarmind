const { Pool } = require('pg');

// Read from .env
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'zarmind',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  console.log('🔌 Testing database connection...');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Port:', process.env.DB_PORT || '5432');
  console.log('Database:', process.env.DB_NAME || 'zarmind');
  console.log('User:', process.env.DB_USER || 'postgres');
  console.log('');

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL!');
    
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('📊 Server info:');
    console.log('  Version:', result.rows[0].version.split(',')[0]);
    console.log('  Database:', result.rows[0].current_database);
    console.log('  User:', result.rows[0].current_user);
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables found:');
    tablesResult.rows.forEach(row => console.log('  -', row.table_name));
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check your .env file has correct credentials');
    console.error('  2. Make sure PostgreSQL is running');
    console.error('  3. Verify user exists: psql -U ' + (process.env.DB_USER || 'postgres') + ' -d ' + (process.env.DB_NAME || 'zarmind'));
    console.error('  4. Check pg_hba.conf allows connections from localhost');
    process.exit(1);
  }
}

testConnection();