/**
 * Development Server for Deals Pipeline Feature
 * Standalone server for isolated development and testing
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { query } = require('./shared/database/connection');
const authMock = require('../mocks/auth.mock');
const capabilityService = require('./services/capability.service');
console.log("ENV:", process.env.NODE_ENV);

// Mock auth if not already loaded
if (!global.jwtAuthMock) {
  const authMock = require('../mocks/auth.mock');
  global.jwtAuthMock = authMock.jwtAuth;
}

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware - CORS configuration for development (allow all localhost)
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin in development
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Development login endpoint (no auth required)
app.post('/api/auth/dev-login', async (req, res) => {
  try {
    const { email } = req.body || {};

    // Default dev email if none is provided
    const userEmail = email || 'suhas@example.com';

    const sql = `
      SELECT 
        u.id,
        u.email,
        u.primary_tenant_id,
        m.role as membership_role
      FROM lad_dev.users u
      LEFT JOIN lad_dev.memberships m 
        ON m.user_id = u.id 
        AND m.tenant_id = u.primary_tenant_id
      WHERE u.email = $1
      LIMIT 1
    `;

    const result = await query(sql, [userEmail]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Dev user not found for email: ${userEmail}`
      });
    }

    const dbUser = result.rows[0];

    const capabilities = await capabilityService.getUserCapabilities(dbUser.id, dbUser.primary_tenant_id);
    
    const token = authMock.generateMockToken({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.membership_role, // Default to 'user' if no role found
      tenant_id: dbUser.primary_tenant_id,
      capabilities
    });

    console.log('[Dev Login] dbUser =', dbUser);
    console.log('[Dev Login] primary_tenant_id =', dbUser.primary_tenant_id);
    console.log('[Dev Login] User capabilities:', capabilities);

    res.json({
      success: true,
      token,
      user: {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.membership_role,
        primary_tenant_id: dbUser.primary_tenant_id
      },
      tenant: {
        id: dbUser.primary_tenant_id,
        name: 'LAD'
      },
      message: 'Development login successful'
    });
    console.log('[Dev Login] dbUser =', dbUser);
console.log('[Dev Login] primary_tenant_id =', dbUser.primary_tenant_id);
  } 
  
  catch (err) {
    console.error('[Dev Login Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to perform dev login'
    });
  }
});

// Apply mock auth middleware for all other API routes
app.use('/api', authMock.jwtAuth);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'deals-pipeline',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount deals-pipeline routes
const dealsPipelineRouter = require('./routes');
app.use('/api/deals-pipeline', dealsPipelineRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Deals Pipeline Development Server');
  console.log('=====================================');
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📋 API Base Path: http://localhost:${PORT}/api/deals-pipeline`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('  - GET  /api/deals-pipeline/leads');
  console.log('  - GET  /api/deals-pipeline/stages');
  console.log('  - GET  /api/deals-pipeline/pipeline/board');
  console.log('  - GET  /api/deals-pipeline/reference/statuses');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
