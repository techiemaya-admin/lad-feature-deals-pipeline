/**
 * Feature Flag Service
 * Mock implementation for standalone feature development
 * In production, this should integrate with the main LAD feature flag system
 */

class FeatureFlagService {
  constructor() {
    // Default feature flags for development
    this.defaultFlags = {
      'education-students': true,
      'education-counsellors': true,
      'deals-pipeline': true,
      'bookings-integration': true,
      'follow-up-scheduler': true
    };
  }

  /**
   * Check if a feature is enabled for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} featureKey - Feature key to check
   * @param {string} userId - User ID (optional)
   * @returns {Promise<boolean>} Whether the feature is enabled
   */
  async isEnabled(tenantId, featureKey, userId = null) {
    // In dev mode, return true for all configured features
    if (process.env.NODE_ENV === 'development') {
      return this.defaultFlags[featureKey] !== undefined ? this.defaultFlags[featureKey] : true;
    }

    // In production, this should query the database or feature flag service
    // For now, return the default value
    return this.defaultFlags[featureKey] || false;
  }

  /**
   * Get all enabled features for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} Object with feature keys and their enabled status
   */
  async getEnabledFeatures(tenantId) {
    if (process.env.NODE_ENV === 'development') {
      return { ...this.defaultFlags };
    }

    // In production, query the database
    return { ...this.defaultFlags };
  }

  /**
   * Enable a feature for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} featureKey - Feature key to enable
   * @returns {Promise<boolean>} Success status
   */
  async enableFeature(tenantId, featureKey) {
    // In dev mode, just update the in-memory flags
    this.defaultFlags[featureKey] = true;
    return true;
  }

  /**
   * Disable a feature for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} featureKey - Feature key to disable
   * @returns {Promise<boolean>} Success status
   */
  async disableFeature(tenantId, featureKey) {
    // In dev mode, just update the in-memory flags
    this.defaultFlags[featureKey] = false;
    return true;
  }
}

module.exports = { FeatureFlagService };
