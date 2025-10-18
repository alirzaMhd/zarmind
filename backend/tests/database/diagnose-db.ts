import 'dotenv/config';
import { Client } from 'pg';

console.log('═══════════════════════════════════════════════════════');
console.log('DATABASE CONNECTION DIAGNOSTICS');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Environment Variables:');
console.log('  DB_HOST:', process.env.DB_HOST || 'localhost (default)');
console.log('  DB_PORT:', process.env.DB_PORT || '5432 (default)');
console.log('  DB_NAME:', process.env.DB_NAME || 'zarmind (default)');
console.log('  DB_USER:', process.env.DB_USER || 'postgres (default)');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***');
console.log('  DB_SSL:', process.env.DB_SSL || 'false (default)');
console.log('\n');

const tests = [
  {
    name: 'Test 1: Connect to default postgres database',
    config: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: 'postgres', // Default database
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      connectionTimeoutMillis: 5000,
    }
  },
  {
    name: 'Test 2: Connect to target database',
    config: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'zarmind',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      connectionTimeoutMillis: 5000,
    }
  },
  {
    name: 'Test 3: Connect to localhost explicitly',
    config: {
      host: '127.0.0.1', // Use IP instead of hostname
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      connectionTimeoutMillis: 5000,
    }
  }
];

async function runTest(test: typeof tests[0]) {
  console.log(`\n${test.name}`);
  console.log('─'.repeat(60));
  
  const client = new Client(test.config);
  
  try {
    console.log('→ Attempting connection...');
    const startConnect = Date.now();
    await client.connect();
    const connectTime = Date.now() - startConnect;
    console.log(`✓ Connected in ${connectTime}ms`);
    
    console.log('→ Running test query...');
    const startQuery = Date.now();
    const result = await client.query('SELECT NOW() as now, current_database() as db, current_user as user');
    const queryTime = Date.now() - startQuery;
    
    console.log(`✓ Query executed in ${queryTime}ms`);
    console.log('  Server time:', result.rows[0].now);
    console.log('  Database:', result.rows[0].db);
    console.log('  User:', result.rows[0].user);
    
    // Check if target database exists
    if (test.config.database === 'postgres') {
      console.log('→ Checking if target database exists...');
      const dbCheck = await client.query(
        "SELECT datname FROM pg_database WHERE datname = $1",
        [process.env.DB_NAME || 'zarmind']
      );
      
      if (dbCheck.rows.length === 0) {
        console.log(`✗ Database '${process.env.DB_NAME || 'zarmind'}' does NOT exist`);
        console.log(`  Run this command to create it:`);
        console.log(`  psql -U postgres -c "CREATE DATABASE ${process.env.DB_NAME || 'zarmind'};"`);
      } else {
        console.log(`✓ Database '${process.env.DB_NAME || 'zarmind'}' exists`);
      }
      
      // List all databases
      console.log('→ Available databases:');
      const allDbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname");
      allDbs.rows.forEach(row => console.log(`  - ${row.datname}`));
    }
    
    await client.end();
    console.log('✓ TEST PASSED');
    return true;
    
  } catch (error: any) {
    console.log('✗ TEST FAILED');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('  → PostgreSQL is not running or not listening on this port');
    } else if (error.code === '28P01') {
      console.error('  → Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      console.error('  → Database does not exist');
    } else if (error.message.includes('timeout')) {
      console.error('  → Connection timeout - possible network/firewall issue');
    }
    
    try {
      await client.end();
    } catch {}
    
    return false;
  }
}

async function main() {
  let allPassed = true;
  
  for (const test of tests) {
    const passed = await runTest(test);
    if (!passed) allPassed = false;
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('✓ ALL TESTS PASSED');
    console.log('The database connection configuration is correct.');
    console.log('If the app still fails, the issue is in the application code.');
  } else {
    console.log('✗ SOME TESTS FAILED');
    console.log('Review the errors above and fix the configuration.');
  }
  console.log('═══════════════════════════════════════════════════════\n');
  
  process.exit(allPassed ? 0 : 1);
}

main();