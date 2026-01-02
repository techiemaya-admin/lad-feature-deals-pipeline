/**
 * Database Connection Pool - LAD Architecture Compliant
 * Shared PostgreSQL connection for all features
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Parse connection string: postgresql://dbadmin:TechieMaya@165.22.221.77:5432/salesmaya_agent?schema=lad_dev
const connectionString = process.env.DATABASE_URL || 'postgresql://dbadmin:TechieMaya@165.22.221.77:5432/salesmaya_agent';
const schema = process.env.DB_SCHEMA || 'lad_dev';

// Create connection pool
const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Set schema for all queries
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${schema}, public`);
});

// Test connection
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection error', err);
  } else {
    logger.info('Database connected successfully', { schema });
  }
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.LOG_QUERIES === 'true') {
      logger.debug('Executed query', { duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    logger.error('Database query error', error, { query: text });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  
  // Set schema for this client
  await client.query(`SET search_path TO ${schema}, public`);
  
  const query = client.query;
  const release = client.release;
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    logger.warn('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
};

/**
 * Execute queries in a transaction
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Close all connections in the pool
 * @returns {Promise<void>}
 */
const close = async () => {
  await pool.end();
  logger.info('Database pool has ended');
};

module.exports = {
  query,
  getClient,
  transaction,
  close,
  pool
};
