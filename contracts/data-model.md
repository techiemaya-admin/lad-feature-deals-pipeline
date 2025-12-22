# Data Model - Deals Pipeline Feature

## Database Schema
Schema: `lad_dev`

## Tables

### `leads`
Primary table for lead/deal data.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Lead information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  
  -- Pipeline fields
  stage VARCHAR(50) DEFAULT 'new',
  status VARCHAR(50) DEFAULT 'active',
  source VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  value DECIMAL(12, 2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  
  -- Indexes
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_leads_tenant (tenant_id),
  INDEX idx_leads_stage (stage),
  INDEX idx_leads_status (status)
);
```

### `lead_stages`
Pipeline stages/columns.

```sql
CREATE TABLE lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Stage definition
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  order INTEGER NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_lead_stages_tenant (tenant_id),
  UNIQUE INDEX idx_lead_stages_key (tenant_id, key)
);
```

### `lead_statuses`
Lead status definitions.

```sql
CREATE TABLE lead_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Status definition
  key VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_lead_statuses_tenant (tenant_id)
);
```

### `lead_notes`
Notes/comments attached to leads.

```sql
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  
  -- Note content
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_lead_notes_lead (lead_id)
);
```

## Relationships

```
leads
  └─ tenant_id → tenants.id
  └─ stage → lead_stages.key
  └─ status → lead_statuses.key

lead_stages
  └─ tenant_id → tenants.id

lead_statuses
  └─ tenant_id → tenants.id

lead_notes
  └─ lead_id → leads.id
  └─ created_by → users.id
```

## Tenant Isolation

**CRITICAL:** All queries MUST include `tenant_id` filtering.

```javascript
// ✅ CORRECT
const leads = await db.query(
  'SELECT * FROM leads WHERE tenant_id = $1',
  [tenantId]
);

// ❌ WRONG - Missing tenant isolation
const leads = await db.query('SELECT * FROM leads');
```

## Schema Rules

1. **No Direct Modifications:** Schema changes must go through migration system
2. **All Tables Include tenant_id:** Except purely relational tables
3. **UUIDs for IDs:** Use gen_random_uuid() for primary keys
4. **Timestamps:** created_at, updated_at where applicable
5. **Foreign Keys:** Always define relationships
6. **Indexes:** Include tenant_id in composite indexes

## Reference Data

Some data is static (not in DB):

### Sources
```javascript
['website', 'referral', 'event', 'social', 'cold_call', 'email']
```

### Priorities
```javascript
['low', 'medium', 'high', 'urgent']
```

These are defined in `reference.service.js` and should not be stored in the database unless customer needs customization.
