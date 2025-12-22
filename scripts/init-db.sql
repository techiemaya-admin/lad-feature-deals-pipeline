-- Initialize database schema for deals-pipeline feature
-- ✅ LAD Compliant: All tables properly tenant-scoped

-- Create lead_stages table (must exist before leads for FK)
CREATE TABLE IF NOT EXISTS lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- LAD: Tenant-scoped uniqueness
  UNIQUE (tenant_id, key),
  UNIQUE (tenant_id, display_order)
);

-- Create lead_statuses table (must exist before leads for FK)
CREATE TABLE IF NOT EXISTS lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- LAD: Tenant-scoped uniqueness
  UNIQUE (tenant_id, key)
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  stage VARCHAR(50) NOT NULL DEFAULT 'new',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  source VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  value DECIMAL(12, 2),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- LAD: Foreign keys to ensure referential integrity
  FOREIGN KEY (tenant_id, stage) REFERENCES lead_stages(tenant_id, key) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, status) REFERENCES lead_statuses(tenant_id, key) ON DELETE RESTRICT
);

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- LAD: Foreign key with cascade
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Indexes for performance (tenant-scoped queries)
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage ON leads(tenant_id, stage) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON leads(tenant_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_lead_notes_tenant_lead ON lead_notes(tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_stages_tenant_order ON lead_stages(tenant_id, display_order);

-- Dev-only seed data (for local development with mock tenant)
-- In production, this should be done via migrations per tenant
DO $$
DECLARE
  mock_tenant_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Mock tenant for dev
BEGIN
  -- Insert default stages for mock tenant
  INSERT INTO lead_stages (tenant_id, key, label, description, display_order) VALUES 
    (mock_tenant_id, 'new', 'New', 'Newly created leads', 1),
    (mock_tenant_id, 'contacted', 'Contacted', 'Initial contact made', 2),
    (mock_tenant_id, 'qualified', 'Qualified', 'Lead is qualified', 3),
    (mock_tenant_id, 'proposal', 'Proposal', 'Proposal sent', 4),
    (mock_tenant_id, 'negotiation', 'Negotiation', 'In negotiation', 5),
    (mock_tenant_id, 'won', 'Won', 'Deal won', 6),
    (mock_tenant_id, 'lost', 'Lost', 'Deal lost', 7)
  ON CONFLICT (tenant_id, key) DO NOTHING;

  -- Insert default statuses for mock tenant
  INSERT INTO lead_statuses (tenant_id, key, label) VALUES 
    (mock_tenant_id, 'active', 'Active'),
    (mock_tenant_id, 'on_hold', 'On Hold'),
    (mock_tenant_id, 'closed_won', 'Closed Won'),
    (mock_tenant_id, 'closed_lost', 'Closed Lost'),
    (mock_tenant_id, 'archived', 'Archived')
  ON CONFLICT (tenant_id, key) DO NOTHING;

  -- Insert sample leads for mock tenant
  INSERT INTO leads (tenant_id, name, email, company, stage, status, value, priority) VALUES 
    (mock_tenant_id, 'John Doe', 'john@example.com', 'Acme Corp', 'new', 'active', 50000, 'high'),
    (mock_tenant_id, 'Jane Smith', 'jane@company.com', 'Tech Inc', 'contacted', 'active', 75000, 'medium'),
    (mock_tenant_id, 'Bob Johnson', 'bob@startup.io', 'Startup LLC', 'qualified', 'active', 120000, 'high'),
    (mock_tenant_id, 'Alice Brown', 'alice@enterprise.com', 'Enterprise Co', 'proposal', 'active', 200000, 'urgent'),
    (mock_tenant_id, 'Charlie Wilson', 'charlie@business.net', 'Business Ltd', 'negotiation', 'active', 150000, 'high')
  ON CONFLICT DO NOTHING;
END $$;
