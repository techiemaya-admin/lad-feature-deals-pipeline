#!/usr/bin/env node
/**
 * LAD Feature Development Server
 * Universal server for standalone feature development and testing
 * LAD Architecture Compliant
 * 
 * This server can be reused across all LAD feature repositories.
 * It automatically detects the feature name and loads appropriate routes.
 * 
 * Configuration:
 * - Set FEATURE_NAME env var, or it will auto-detect from package.json
 * - Set FEATURE_PATH env var to override feature directory location
 * - Set PORT env var to change server port (default: 3004)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const logger = require('./backend/shared/utils/logger');
const { DEFAULT_SCHEMA } = require('./backend/shared/utils/schemaHelper');

// Initialize database connection
const db = require('./backend/shared/database/connection');

// Auto-detect feature name from package.json
function getFeatureName() {
  if (process.env.FEATURE_NAME) {
    return process.env.FEATURE_NAME;
  }
  
  try {
    const packageJson = require('./package.json');
    // Extract feature name from package name (e.g., "lad-feature-deals-pipeline" -> "deals-pipeline")
    const match = packageJson.name.match(/lad-feature-(.+)/);
    if (match) {
      return match[1];
    }
    return packageJson.name;
  } catch (error) {
    logger.warn('Could not auto-detect feature name from package.json');
    return 'unknown-feature';
  }
}

const FEATURE_NAME = getFeatureName();
const FEATURE_PATH = process.env.FEATURE_PATH || `./backend/features/${FEATURE_NAME}`;
const API_PREFIX = `/api/${FEATURE_NAME}`;

// Simple in-memory token store for dev (use Redis in production)
const tokenStore = new Map();

// JWT authentication middleware with tenant context
const jwtAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  logger.debug('[jwtAuth] Checking token', { 
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
    tokenStoreSize: tokenStore.size,
    tokenStoreKeys: Array.from(tokenStore.keys()).map(k => k.substring(0, 30) + '...')
  });
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('[jwtAuth] No Bearer token in Authorization header');
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No token provided' 
    });
  }
  
  const token = authHeader;
  
  // Look up user data from token store
  const userData = tokenStore.get(token);
  
  if (!userData) {
    logger.warn('[jwtAuth] Token not found in store', { 
      token: token.substring(0, 30) + '...',
      storeHasToken: tokenStore.has(token)
    });
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token not found or expired. Please login again.' 
    });
  }
  
  logger.debug('[jwtAuth] Token valid', { userId: userData.id, email: userData.email });
  
  // Attach user context to request
  req.user = userData;
  next();
};

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware - CORS configuration for development (allow all origins)
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { 
    method: req.method, 
    path: req.path,
    tenant_id: req.user?.tenant_id 
  });
  next();
});

// Development login endpoint (no auth required) - for quick testing only
// WARNING: This endpoint accepts any email without validation
// Use /api/auth/login for proper database-backed authentication
app.post('/api/auth/dev-login', (req, res) => {
  const { email } = req.body;
  const token = 'Bearer dev-token-' + Date.now();
  
  const devUser = {
    id: 'dev-user-' + Date.now(),
    userId: 'dev-user-' + Date.now(),
    email: email || 'dev@example.com',
    name: email ? email.split('@')[0] : 'Dev User',
    tenant_id: 'dev-tenant-' + Date.now(),
    tenantId: 'dev-tenant-' + Date.now(),
    role: 'admin',
    schema: DEFAULT_SCHEMA
  };
  
  // Store in token store
  tokenStore.set(token, devUser);
  
  res.json({
    success: true,
    token,
    user: devUser
  });
});

// Standard login endpoint (matches frontend expectations)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }
  
  try {
    // Query database for user with their primary tenant and role
    // Join with memberships to get the user's role for their primary tenant
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.primary_tenant_id as tenant_id,
        COALESCE(m.role, 'member') as role,
        u.deleted_at
      FROM ${DEFAULT_SCHEMA}.users u
      LEFT JOIN ${DEFAULT_SCHEMA}.memberships m 
        ON u.id = m.user_id 
        AND u.primary_tenant_id = m.tenant_id
        AND m.deleted_at IS NULL
      WHERE LOWER(u.email) = LOWER($1)
        AND u.deleted_at IS NULL
        AND u.is_active = true
      LIMIT 1
    `;
    
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'User not found or inactive'
      });
    }
    
    const user = result.rows[0];
    
    // TODO: In production, verify password hash here with bcrypt
    // const isValidPassword = await bcrypt.compare(password, user.password_hash);
    // if (!isValidPassword) {
    //   return res.status(401).json({ success: false, error: 'Invalid credentials' });
    // }
    
    // For development: accept any password (CHANGE THIS FOR PRODUCTION)
    logger.warn('Development mode: Password validation skipped');
    
    // Ensure user has a tenant_id
    if (!user.tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'User has no primary tenant assigned',
        message: 'Please contact administrator to set up your tenant'
      });
    }
    
    // Generate token
    const token = 'Bearer dev-token-' + Date.now();
    
    // Prepare user data
    const userName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.first_name || user.email.split('@')[0];
    
    const userData = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: userName,
      tenant_id: user.tenant_id,
      tenantId: user.tenant_id,
      role: user.role || 'member',
      schema: DEFAULT_SCHEMA
    };
    
    // Store user data with token
    tokenStore.set(token, userData);
    
    logger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email,
      tenant_id: user.tenant_id,
      role: user.role
    });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: userName,
        tenant_id: user.tenant_id,
        role: user.role || 'member'
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', jwtAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Logout endpoint
app.post('/api/auth/logout', jwtAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Remove token from store
    tokenStore.delete(authHeader);
    logger.info('User logged out', { userId: req.user.id });
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    feature: FEATURE_NAME,
    timestamp: new Date().toISOString() 
  });
});

// Load feature routes dynamically
try {
  const routesPath = path.join(__dirname, FEATURE_PATH, 'routes');
  
  // Check if routes file exists
  if (!fs.existsSync(routesPath + '.js') && !fs.existsSync(path.join(routesPath, 'index.js'))) {
    logger.warn(`Routes not found at ${routesPath}. Feature routes not loaded.`);
  } else {
    const featureRoutes = require(routesPath);
    app.use(API_PREFIX, jwtAuth, featureRoutes);
    logger.info(`${FEATURE_NAME} routes loaded successfully`, { 
      apiPrefix: API_PREFIX,
      routesPath 
    });
  }
} catch (error) {
  logger.error(`Error loading ${FEATURE_NAME} routes`, error);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, { path: req.path, method: req.method });
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('\n🚀 ============================================');
  logger.info(`   LAD Feature Development Server`);
  logger.info(`   Feature: ${FEATURE_NAME}`);
  logger.info('   ============================================');
  logger.info(`   📍 URL: http://localhost:${PORT}`);
  logger.info(`   🔗 API: http://localhost:${PORT}${API_PREFIX}`);
  logger.info(`   🏥 Health: http://localhost:${PORT}/health`);
  logger.info(`   🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
  logger.info(`   🔐 Dev Login: POST http://localhost:${PORT}/api/auth/dev-login (testing only)`);
  logger.info(`   👤 Current User: GET http://localhost:${PORT}/api/auth/me`);
  logger.info(`   🚪 Logout: POST http://localhost:${PORT}/api/auth/logout`);
  logger.info('   ============================================');
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   Database: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
  logger.info(`   Schema: ${DEFAULT_SCHEMA}`);
  logger.info('   ============================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  // Clear token store
  tokenStore.clear();
  
  // Close database connection
  try {
    await db.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('\nSIGINT received, shutting down gracefully...');
  
  // Clear token store
  tokenStore.clear();
  
  // Close database connection
  try {
    await db.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', error);
  }
  
  process.exit(0);
});
