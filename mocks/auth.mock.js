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
    email: 'suhas@example.com',
    role: 'admin'
  };
  
  req.tenant = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'LAD'
  };
  
  next();
};

/**
 * Generate mock JWT token
 */
exports.generateMockToken = (payload = {}) => {
  return jwt.sign({
    userId: 'mock-user-123',
    email: 'suhas@example.com',
    tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
