/**
 * Mock Authentication
 * Provides fake JWT auth for isolated development
 */

const jwt = require('jsonwebtoken');

const MOCK_SECRET = 'mock-secret-for-dev-only';

/**
 * Mock JWT middleware
 */
exports.jwtAuth = (req, res, next) => {
  // In real app, this would validate JWT from header
  // For mock, we just inject a fake user
  
  req.user = {
    userId: 'mock-user-123',
    email: 'developer@example.com',
    role: 'admin'
  };
  
  req.tenant = {
    id: 'mock-tenant-456',
    name: 'Mock Tenant'
  };
  
  next();
};

/**
 * Generate mock JWT token
 */
exports.generateMockToken = (payload = {}) => {
  return jwt.sign({
    userId: 'mock-user-123',
    email: 'developer@example.com',
    ...payload
  }, MOCK_SECRET, { expiresIn: '24h' });
};

/**
 * Verify mock token
 */
exports.verifyMockToken = (token) => {
  try {
    return jwt.verify(token, MOCK_SECRET);
  } catch (error) {
    return null;
  }
};
