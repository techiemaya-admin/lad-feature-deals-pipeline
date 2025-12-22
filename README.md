# Deals Pipeline Feature - Canonical LAD Workspace

> **Bounded Context Repo** for the Deals Pipeline feature following the Canonical LAD Way

## 🎯 What This Is

This is a **mini-workspace** containing:
- ✅ One feature (deals-pipeline) with backend + SDK
- ✅ Clear contracts (API, data model, rules)
- ✅ Mock infrastructure (auth, tenant, database)
- ✅ Validation scripts to enforce LAD rules
- ✅ Zero access to other features

**Goal:** Give developers just enough context to build correctly, without leaking the whole platform.

## 📦 What's Inside

```
lad-feature-deals-pipeline/
├── backend/features/deals-pipeline/    # Backend feature
│   ├── routes/                        # 6 route files (was 1x626 lines)
│   ├── controllers/                   # 5 controllers
│   ├── services/                      # 5 services
│   ├── models/                        # 3 models
│   ├── middleware/
│   │   └── auth.js                    # Auth middleware
│   └── manifest.js                    # Feature definition
├── frontend/sdk/features/deals-pipeline/  # SDK (TypeScript)
├── ui/pipeline/                       # Optional UI components
├── contracts/                         # Documentation
│   ├── api.md                         # API endpoints & types
│   ├── data-model.md                  # Database schema
│   └── feature-rules.md               # LAD compliance rules
├── mocks/                             # Mock infrastructure
│   ├── auth.mock.ts                   # Fake JWT auth
│   ├── tenant.mock.ts                 # Fake tenant context
│   └── db.mock.ts                     # In-memory database
└── scripts/                           # Development tools
    ├── dev.sh                         # Start dev server
    └── validate.sh                    # Check LAD compliance
```

## 🏗️ Architecture

### Refactored from Monolithic Routes

**BEFORE:**
- ❌ `routes.js` = 626 lines
- ❌ Business logic mixed with HTTP handling
- ❌ API paths: `/api/leads/*`

**AFTER:**
- ✅ 6 route files (< 150 lines each)
- ✅ Proper layering: Routes → Controllers → Services → Models
- ✅ API paths: `/api/deals-pipeline/*`

### Layer Responsibilities

```
Routes (HTTP)
    ↓ Pass request/response
Controllers (Coordination)
    ↓ Call business logic
Services (Business Logic)
    ↓ Call data access
Models (Database)
```

**Rule:** No layer-skipping. Routes must call Controllers, Controllers must call Services.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Git

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env if needed (defaults work for local dev)
```

### 3. Start Development Server
```bash
./scripts/dev.sh
```

This will:
- Start PostgreSQL (in Docker if needed)
- Initialize database schema
- Start Express server on port 3004
- Mount API at `/api/deals-pipeline`

### 3. Test API
```bash
# Get pipeline board
curl http://localhost:3004/api/deals-pipeline/pipeline/board

# List leads
curl http://localhost:3004/api/deals-pipeline/leads

# Get stages
curl http://localhost:3004/api/deals-pipeline/stages
```

### 4. Validate Code
```bash
./scripts/validate.sh
```

This checks:
- File size limits (< 400 lines)
- No cross-feature imports
- Tenant isolation
- API path consistency
- Authentication on all routes

## 📋 API Reference

### Base Path
```
/api/deals-pipeline
```

### Main Endpoints

**Leads**
- `GET /leads` - List all leads
- `GET /leads/:id` - Get single lead
- `POST /leads` - Create lead
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead
- `GET /leads/stats` - Get statistics

**Stages**
- `GET /stages` - List pipeline stages
- `POST /stages` - Create stage
- `PUT /stages/:key` - Update stage
- `DELETE /stages/:key` - Delete stage
- `PUT /stages/reorder` - Reorder stages

**Pipeline**
- `GET /pipeline/board` - Get complete board data
- `PUT /pipeline/leads/:id/stage` - Move lead to stage
- `PUT /pipeline/leads/:id/status` - Update lead status

**Reference Data**
- `GET /reference/statuses` - Get all statuses
- `GET /reference/sources` - Get all sources
- `GET /reference/priorities` - Get all priorities

**Full API documentation:** [contracts/api.md](contracts/api.md)

## 📊 Database Schema

### Tables
- `leads` - Lead/deal data
- `lead_stages` - Pipeline stages/columns
- `lead_statuses` - Status definitions
- `lead_notes` - Notes attached to leads

### Tenant Isolation
**CRITICAL:** Every query MUST filter by `tenant_id`

```javascript
// ✅ CORRECT
const leads = await db.query(
  'SELECT * FROM leads WHERE tenant_id = $1',
  [tenantId]
);

// ❌ WRONG
const leads = await db.query('SELECT * FROM leads');
```

**Full schema documentation:** [contracts/data-model.md](contracts/data-model.md)

## 🎯 LAD Compliance Rules

### 1. File Size Limits
- ❌ No file > 400 lines
- ✅ Split large files into smaller modules

### 2. Architecture Pattern
**MANDATORY:** Routes → Controllers → Services → Models

### 3. No Cross-Feature Dependencies
```javascript
// ❌ FORBIDDEN
const userService = require('../../users/services');

// ✅ ALLOWED
const leadService = require('../services/lead.service');
```

### 4. API Path Consistency
Base path: `/api/deals-pipeline` (not `/api/leads`)

### 5. Tenant Isolation
All queries must include `tenant_id` filtering

### 6. Authentication
All routes must use `jwtAuth` middleware

**Full rules:** [contracts/feature-rules.md](contracts/feature-rules.md)

## 🧪 Testing

### Run Validation
```bash
./scripts/validate.sh
```

### Manual Testing
```bash
# Start server
./scripts/dev.sh

# In another terminal
curl -X POST http://localhost:3004/api/deals-pipeline/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","email":"test@example.com"}'
```

### Unit Tests (TODO)
```bash
npm test
```

## 📖 Documentation

- [API Contract](contracts/api.md) - Endpoints, types, responses
- [Data Model](contracts/data-model.md) - Database schema
- [Feature Rules](contracts/feature-rules.md) - LAD compliance rules

## 🔧 Development Workflow

### 1. Start Working
```bash
git checkout -b feature/add-lead-tags
./scripts/dev.sh
```

### 2. Make Changes
- Follow the architecture pattern
- Keep files under 400 lines
- Add tests for new code

### 3. Validate
```bash
./scripts/validate.sh
```

### 4. Commit
```bash
git add .
git commit -m "Add lead tags feature"
git push origin feature/add-lead-tags
```

## 🚨 Common Mistakes

### ❌ Business Logic in Routes
```javascript
// WRONG
router.get('/', jwtAuth, async (req, res) => {
  const leads = await Lead.listLeads();
  res.json(leads);
});
```

### ✅ Proper Layering
```javascript
// RIGHT
router.get('/', jwtAuth, leadController.list);
```

### ❌ Cross-Feature Imports
```javascript
// WRONG
const userService = require('../../users/services');
```

### ✅ Within-Feature Only
```javascript
// RIGHT
const leadService = require('../services/lead.service');
```

### ❌ Missing Tenant Filter
```javascript
// WRONG
SELECT * FROM leads WHERE id = $1
```

### ✅ Always Filter by Tenant
```javascript
// RIGHT
SELECT * FROM leads WHERE id = $1 AND tenant_id = $2
```

## 📝 Migration from Main Repo

If you're migrating this feature back to the main LAD repo:

1. **Copy Files:**
   ```bash
   cp -r backend/features/deals-pipeline/* /path/to/LAD/backend/features/deals-pipeline/
   ```

2. **Update Manifest:**
   - Change `basePath` in manifest.js
   - Update route mounting in main app

3. **Update Frontend:**
   - Update API base URL
   - Copy SDK to frontend/sdk/features/deals-pipeline

4. **Database Migration:**
   - Create migration file in /migrations
   - Update schema to match contracts/data-model.md

5. **Test:**
   - Run validation scripts
   - Test all endpoints
   - Verify tenant isolation

## 🤝 Contributing

1. Follow the architecture pattern
2. Keep files small (< 400 lines)
3. Write tests
4. Run validation before committing
5. Update documentation

## 📄 License

Proprietary - LAD Platform

## 📞 Support

- Technical Lead: [Your Name]
- Documentation: [Link to Wiki]
- Slack: #lad-deals-pipeline

---

**Remember:** This is a bounded context. You have everything you need to build, test, and validate this feature without accessing other parts of the platform.
