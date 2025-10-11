// ==========================================
// ZARMIND - Database Configuration
// ==========================================

import { Pool, PoolClient, QueryResult, PoolConfig } from 'pg';
import logger, { logQuery, logError, logSystem } from '../utils/logger';
import { IDbConfig } from '../types';

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'zarmind',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10), // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if no connection available
  allowExitOnIdle: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// ==========================================
// CREATE POOL
// ==========================================

const pool = new Pool(dbConfig);

// ==========================================
// POOL EVENT HANDLERS
// ==========================================

pool.on('connect', (client) => {
  logSystem('New client connected to database', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

pool.on('acquire', (client) => {
  logger.debug('Client acquired from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

pool.on('remove', (client) => {
  logger.debug('Client removed from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
  });
});

pool.on('error', (err, client) => {
  logError(err, 'Unexpected database pool error');
});

// ==========================================
// QUERY HELPER FUNCTION
// ==========================================

/**
 * Execute a query with automatic connection handling
 */
export const query = async <T extends QueryResult = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    logQuery(text, params, duration);
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logError(error as Error, 'Database Query Error', {
      query: text,
      params,
      duration,
    });
    throw error;
  }
};

// ==========================================
// GET CLIENT (for transactions)
// ==========================================

/**
 * Get a client from the pool for manual transaction control
 */
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  
  logger.debug('Client checked out from pool', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
  
  return client;
};

// ==========================================
// TRANSACTION WRAPPER
// ==========================================

/**
 * Execute a function within a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logger.debug('Transaction committed');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.warn('Transaction rolled back', { error: (error as Error).message });
    throw error;
  } finally {
    client.release();
    logger.debug('Transaction client released');
  }
};

// ==========================================
// BATCH QUERY HELPER
// ==========================================

/**
 * Execute multiple queries in a transaction
 */
export const batchQuery = async (
  queries: Array<{ text: string; params?: any[] }>
): Promise<QueryResult[]> => {
  return transaction(async (client) => {
    const results: QueryResult[] = [];
    
    for (const { text, params } of queries) {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logQuery(text, params, duration);
      results.push(result);
    }
    
    return results;
  });
};

// ==========================================
// QUERY BUILDERS
// ==========================================

/**
 * Build INSERT query with RETURNING
 */
export const buildInsertQuery = (
  table: string,
  data: Record<string, any>,
  returning: string = '*'
): { text: string; params: any[] } => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const columns = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING ${returning}`;
  
  return { text, params: values };
};

/**
 * Build UPDATE query with WHERE clause
 */
export const buildUpdateQuery = (
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning: string = '*'
): { text: string; params: any[] } => {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  const setClause = dataKeys
    .map((key, i) => `${key} = $${i + 1}`)
    .join(', ');
  
  const whereClause = whereKeys
    .map((key, i) => `${key} = $${dataKeys.length + i + 1}`)
    .join(' AND ');
  
  const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;
  const params = [...dataValues, ...whereValues];
  
  return { text, params };
};

/**
 * Build DELETE query with WHERE clause
 */
export const buildDeleteQuery = (
  table: string,
  where: Record<string, any>,
  returning?: string
): { text: string; params: any[] } => {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  const whereClause = whereKeys
    .map((key, i) => `${key} = $${i + 1}`)
    .join(' AND ');
  
  const returningClause = returning ? ` RETURNING ${returning}` : '';
  const text = `DELETE FROM ${table} WHERE ${whereClause}${returningClause}`;
  
  return { text, params: whereValues };
};

/**
 * Build SELECT query with pagination
 */
export const buildSelectQuery = (
  table: string,
  options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): { text: string; params: any[] } => {
  const {
    select = ['*'],
    where = {},
    orderBy,
    limit,
    offset,
  } = options;
  
  const columns = select.join(', ');
  let text = `SELECT ${columns} FROM ${table}`;
  const params: any[] = [];
  
  // WHERE clause
  const whereKeys = Object.keys(where);
  if (whereKeys.length > 0) {
    const whereClause = whereKeys
      .map((key, i) => {
        params.push(where[key]);
        return `${key} = $${params.length}`;
      })
      .join(' AND ');
    text += ` WHERE ${whereClause}`;
  }
  
  // ORDER BY
  if (orderBy) {
    text += ` ORDER BY ${orderBy}`;
  }
  
  // LIMIT
  if (limit) {
    params.push(limit);
    text += ` LIMIT $${params.length}`;
  }
  
  // OFFSET
  if (offset) {
    params.push(offset);
    text += ` OFFSET $${params.length}`;
  }
  
  return { text, params };
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if database is connected
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW() as now');
    logSystem('Database connection test successful', {
      serverTime: result.rows[0]?.now,
    });
    return true;
  } catch (error) {
    logError(error as Error, 'Database connection test failed');
    return false;
  }
};

/**
 * Get database statistics
 */
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

/**
 * Check if a table exists
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  const result = await query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`,
    [tableName]
  );
  
  return result.rows[0]?.exists || false;
};

/**
 * Get table row count
 */
export const getTableCount = async (tableName: string): Promise<number> => {
  const result = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0]?.count || '0', 10);
};

/**
 * Execute raw SQL file
 */
export const executeSQLFile = async (sql: string): Promise<void> => {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    await query(statement);
  }
};

/**
 * Truncate table (WARNING: Deletes all data)
 */
export const truncateTable = async (
  tableName: string,
  cascade: boolean = false
): Promise<void> => {
  const cascadeClause = cascade ? 'CASCADE' : '';
  await query(`TRUNCATE TABLE ${tableName} ${cascadeClause}`);
  logger.warn(`Table truncated: ${tableName}`);
};

/**
 * Drop table (WARNING: Deletes table structure and data)
 */
export const dropTable = async (
  tableName: string,
  ifExists: boolean = true
): Promise<void> => {
  const ifExistsClause = ifExists ? 'IF EXISTS' : '';
  await query(`DROP TABLE ${ifExistsClause} ${tableName} CASCADE`);
  logger.warn(`Table dropped: ${tableName}`);
};

// ==========================================
// SEARCH HELPERS
// ==========================================

/**
 * Build full-text search query
 */
export const buildSearchQuery = (
  table: string,
  searchColumns: string[],
  searchTerm: string,
  additionalWhere?: Record<string, any>
): { text: string; params: any[] } => {
  const params: any[] = [`%${searchTerm}%`];
  
  const searchConditions = searchColumns
    .map(() => {
      const index = params.length;
      return `${searchColumns[params.length - 1]} ILIKE $${index}`;
    })
    .join(' OR ');
  
  let whereClause = `(${searchConditions})`;
  
  if (additionalWhere) {
    const additionalKeys = Object.keys(additionalWhere);
    const additionalConditions = additionalKeys.map((key) => {
      params.push(additionalWhere[key]);
      return `${key} = $${params.length}`;
    });
    
    whereClause += ` AND ${additionalConditions.join(' AND ')}`;
  }
  
  const text = `SELECT * FROM ${table} WHERE ${whereClause}`;
  
  return { text, params };
};

// ==========================================
// MIGRATION HELPERS
// ==========================================

/**
 * Check if migrations table exists, create if not
 */
export const ensureMigrationsTable = async (): Promise<void> => {
  const exists = await tableExists('migrations');
  
  if (!exists) {
    await query(`
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logSystem('Migrations table created');
  }
};

/**
 * Record migration execution
 */
export const recordMigration = async (migrationName: string): Promise<void> => {
  await query(
    'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    [migrationName]
  );
  logSystem(`Migration recorded: ${migrationName}`);
};

/**
 * Check if migration has been executed
 */
export const isMigrationExecuted = async (migrationName: string): Promise<boolean> => {
  const result = await query(
    'SELECT EXISTS(SELECT 1 FROM migrations WHERE name = $1)',
    [migrationName]
  );
  return result.rows[0]?.exists || false;
};

/**
 * Get all executed migrations
 */
export const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await query('SELECT name FROM migrations ORDER BY executed_at ASC');
  return result.rows.map(row => row.name);
};

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

/**
 * Close database pool gracefully
 */
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logSystem('Database pool closed gracefully');
  } catch (error) {
    logError(error as Error, 'Error closing database pool');
    throw error;
  }
};

// ==========================================
// HEALTH CHECK
// ==========================================

/**
 * Comprehensive database health check
 */
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  stats: ReturnType<typeof getPoolStats>;
  latency?: number;
  error?: string;
}> => {
  const timestamp = new Date();
  const stats = getPoolStats();
  
  try {
    const start = Date.now();
    await query('SELECT 1');
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      timestamp,
      stats,
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp,
      stats,
      error: (error as Error).message,
    };
  }
};

// ==========================================
// INITIALIZE DATABASE
// ==========================================

/**
 * Initialize database connection and run startup checks
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    logSystem('Initializing database connection...');
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Log pool stats
    const stats = getPoolStats();
    logSystem('Database initialized successfully', stats);
    
  } catch (error) {
    logError(error as Error, 'Database initialization failed');
    throw error;
  }
};

// ==========================================
// EXPORTS
// ==========================================
export { pool };
    export type { PoolClient, QueryResult };

export default {
  pool,
  query,
  getClient,
  transaction,
  batchQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildSelectQuery,
  buildSearchQuery,
  testConnection,
  getPoolStats,
  tableExists,
  getTableCount,
  executeSQLFile,
  truncateTable,
  dropTable,
  ensureMigrationsTable,
  recordMigration,
  isMigrationExecuted,
  getExecutedMigrations,
  closePool,
  healthCheck,
  initializeDatabase,
};

// ==========================================
// STARTUP
// ==========================================

// Auto-initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().catch((error) => {
    logError(error, 'Fatal: Could not initialize database');
    process.exit(1);
  });
}