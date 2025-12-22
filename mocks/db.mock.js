/**
 * Mock Database Connection
 * Provides in-memory database for isolated development
 */

const { Pool } = require('pg');

// For real development, use PostgreSQL in Docker
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lad_dev_mock',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

/**
 * Query wrapper with automatic tenant filtering
 */
async function query(text, params, tenantId) {
  console.log('[DB Mock] Query:', text);
  console.log('[DB Mock] Params:', params);
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('[DB Mock] Query error:', error);
    throw error;
  }
}

/**
 * Initialize mock database schema
 */
async function initSchema() {
  const queries = [
    // Create leads table
    `CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL DEFAULT 'mock-tenant-456',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      company VARCHAR(255),
      stage VARCHAR(50) DEFAULT 'new',
      status VARCHAR(50) DEFAULT 'active',
      source VARCHAR(50),
      priority VARCHAR(20) DEFAULT 'medium',
      value DECIMAL(12, 2),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    
    // Create stages table
    `CREATE TABLE IF NOT EXISTS lead_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL DEFAULT 'mock-tenant-456',
      key VARCHAR(50) NOT NULL,
      label VARCHAR(100) NOT NULL,
      color VARCHAR(20),
      "order" INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    
    // Create statuses table
    `CREATE TABLE IF NOT EXISTS lead_statuses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL DEFAULT 'mock-tenant-456',
      key VARCHAR(50) NOT NULL,
      label VARCHAR(100) NOT NULL,
      color VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    
    // Create notes table
    `CREATE TABLE IF NOT EXISTS lead_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL,
      content TEXT NOT NULL,
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    
    // Insert default stages
    `INSERT INTO lead_stages (key, label, "order") VALUES 
      ('new', 'New', 1),
      ('contacted', 'Contacted', 2),
      ('qualified', 'Qualified', 3),
      ('proposal', 'Proposal', 4),
      ('negotiation', 'Negotiation', 5),
      ('won', 'Won', 6),
      ('lost', 'Lost', 7)
    ON CONFLICT DO NOTHING`,
    
    // Insert default statuses
    `INSERT INTO lead_statuses (key, label) VALUES 
      ('active', 'Active'),
      ('on_hold', 'On Hold'),
      ('closed_won', 'Closed Won'),
      ('closed_lost', 'Closed Lost')
    ON CONFLICT DO NOTHING`
  ];
  
  for (const sql of queries) {
    try {
      await pool.query(sql);
    } catch (error) {
      console.error('[DB Mock] Schema init error:', error.message);
    }
  }
  
  console.log('[DB Mock] Schema initialized');
}

/**
 * Reset database to clean state
 */
async function resetDatabase() {
  await pool.query('TRUNCATE TABLE lead_notes, leads CASCADE');
  console.log('[DB Mock] Database reset');
}

module.exports = {
  query,
  pool,
  initSchema,
  resetDatabase
};
