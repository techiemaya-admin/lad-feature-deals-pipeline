/**
 * Public Routes - Deals Pipeline Feature
 * Base Path: /api/deal-pipeline
 *
 * Public routes that don't require authentication or feature flag checks
 * Primarily for Cloud Tasks endpoints and webhooks
 */

const express = require('express');
const router = express.Router();

// TODO: Add Cloud Tasks endpoints here when implemented
// Example:
// router.post('/webhook', webhookController.handleWebhook);

module.exports = router;