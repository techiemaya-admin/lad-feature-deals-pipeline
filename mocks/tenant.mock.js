/**
 * Mock Tenant Service
 * Provides fake tenant context for isolated development
 */

interface MockTenant {
  id: string;
  name: string;
  plan: string;
  features: string[];
}

const MOCK_TENANTS: Record<string, MockTenant> = {
  'mock-tenant-456': {
    id: 'mock-tenant-456',
    name: 'Mock Tenant',
    plan: 'enterprise',
    features: ['deals-pipeline', 'ai-icp-assistant', 'campaigns']
  }
};

/**
 * Get tenant by ID
 */
export function getTenantById(tenantId: string): MockTenant | null {
  return MOCK_TENANTS[tenantId] || null;
}

/**
 * Check if tenant has feature access
 */
export function tenantHasFeature(tenantId: string, featureKey: string): boolean {
  const tenant = MOCK_TENANTS[tenantId];
  return tenant ? tenant.features.includes(featureKey) : false;
}

/**
 * Get tenant plan
 */
export function getTenantPlan(tenantId: string): string | null {
  const tenant = MOCK_TENANTS[tenantId];
  return tenant ? tenant.plan : null;
}

/**
 * Create test tenant
 */
export function createMockTenant(data: Partial<MockTenant>): MockTenant {
  const tenant: MockTenant = {
    id: data.id || `mock-tenant-${Date.now()}`,
    name: data.name || 'Test Tenant',
    plan: data.plan || 'professional',
    features: data.features || ['deals-pipeline']
  };
  
  MOCK_TENANTS[tenant.id] = tenant;
  return tenant;
}
