-- Initialize database schema for deals-pipeline feature

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  tenant_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  stage VARCHAR(50) DEFAULT 'new',
  status VARCHAR(50) DEFAULT 'active',
  source VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  value DECIMAL(12, 2),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create stages table
CREATE TABLE IF NOT EXISTS lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create statuses table
CREATE TABLE IF NOT EXISTS lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default stages
INSERT INTO lead_stages (key, label, description, display_order) VALUES 
  ('new', 'New', 'Newly created leads', 1),
  ('contacted', 'Contacted', 'Initial contact made', 2),
  ('qualified', 'Qualified', 'Lead is qualified', 3),
  ('proposal', 'Proposal', 'Proposal sent', 4),
  ('negotiation', 'Negotiation', 'In negotiation', 5),
  ('won', 'Won', 'Deal won', 6),
  ('lost', 'Lost', 'Deal lost', 7)
ON CONFLICT DO NOTHING;

-- Insert default statuses
INSERT INTO lead_statuses (key, label) VALUES 
  ('active', 'Active'),
  ('on_hold', 'On Hold'),
  ('closed_won', 'Closed Won'),
  ('closed_lost', 'Closed Lost'),
  ('archived', 'Archived')
ON CONFLICT DO NOTHING;

-- Insert sample leads
INSERT INTO leads (name, email, company, stage, status, value, priority) VALUES 
  ('John Doe', 'john@example.com', 'Acme Corp', 'new', 'active', 50000, 'high'),
  ('Jane Smith', 'jane@company.com', 'Tech Inc', 'contacted', 'active', 75000, 'medium'),
  ('Bob Johnson', 'bob@startup.io', 'Startup LLC', 'qualified', 'active', 120000, 'high'),
  ('Alice Brown', 'alice@enterprise.com', 'Enterprise Co', 'proposal', 'active', 200000, 'urgent'),
  ('Charlie Wilson', 'charlie@business.net', 'Business Ltd', 'negotiation', 'active', 150000, 'high')
ON CONFLICT DO NOTHING;
