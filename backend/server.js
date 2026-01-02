/**
 * Development Server for Deals Pipeline Feature
 * Standalone server for isolated development and testing
 * LAD Architecture Compliant
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./shared/utils/logger');
const { DEFAULT_SCHEMA } = require('./shared/utils/schemaHelper');

// Initialize database connection
const db = require('./shared/database/connection');

// Mock auth middleware with tenant context
const jwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // In dev mode, accept any token and provide full tenant context
  const token = authHeader.substring(7);
  req.user = {
    id: '00000000-0000-0000-0000-000000000001', // Mock user UUID
    email: 'dev@example.com',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Mock tenant UUID
    schema: DEFAULT_SCHEMA // LAD: Dynamic schema resolution
  };
  
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { 
    method: req.method, 
    path: req.path,
    tenant_id: req.user?.tenant_id 
  });
  next();
});

// Development login endpoint (no auth required)
app.post('/api/auth/dev-login', (req, res) => {
  const token = 'dev-token-' + Date.now();
  res.json({
    token,
    user: {
      id: 'dev-user-001',
      email: 'dev@example.com',
      name: 'Dev User'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load deals-pipeline feature routes
try {
  const dealsRoutes = require('./features/deals-pipeline/routes');
  app.use('/api/deals-pipeline', jwtAuth, dealsRoutes);
  logger.info('Deals Pipeline routes loaded successfully');
} catch (error) {
  logger.error('Error loading Deals Pipeline routes', error);
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
  logger.info(`   Deals Pipeline Dev Server`);
  logger.info('   ============================================');
  logger.info(`   📍 URL: http://localhost:${PORT}`);
  logger.info(`   🔗 API: http://localhost:${PORT}/api/deals-pipeline`);
  logger.info(`   🏥 Health: http://localhost:${PORT}/health`);
  logger.info(`   🔐 Login: POST http://localhost:${PORT}/api/auth/dev-login`);
  logger.info('   ============================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('\nSIGINT received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});
