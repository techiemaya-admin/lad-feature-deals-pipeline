# Quick Reference - Deals Pipeline Workspace

## 🚀 Quick Start
```bash
cd lad-feature-deals-pipeline
./scripts/dev.sh        # Start development server
./scripts/validate.sh   # Check LAD compliance
```

## 📁 File Structure (Cheat Sheet)
```
routes/         → HTTP endpoints (20-29 lines each)
controllers/    → Request handling (49-98 lines each)
services/       → Business logic (40-52 lines each)
models/         → Database access (existing)
```

## 🎯 Architecture Flow
```
HTTP Request
    ↓
routes/leads.routes.js
    ↓
controllers/lead.controller.js
    ↓
services/lead.service.js
    ↓
models/lead.pg.js
    ↓
Database
```

## 📋 API Endpoints Quick Reference

### Base Path: `/api/deals-pipeline`

**Leads**
- `GET /leads` - List
- `GET /leads/:id` - Get one
- `POST /leads` - Create
- `PUT /leads/:id` - Update
- `DELETE /leads/:id` - Delete
- `GET /leads/stats` - Statistics

**Stages**
- `GET /stages` - List
- `POST /stages` - Create
- `PUT /stages/:key` - Update
- `DELETE /stages/:key` - Delete
- `PUT /stages/reorder` - Reorder

**Pipeline**
- `GET /pipeline/board` - Full board
- `PUT /pipeline/leads/:id/stage` - Move lead
- `PUT /pipeline/leads/:id/status` - Change status

**Reference**
- `GET /reference/statuses` - All statuses
- `GET /reference/sources` - All sources
- `GET /reference/priorities` - All priorities

## 📏 LAD Rules (Quick Check)

✅ **File Size:** < 400 lines (current max: 98)
✅ **Architecture:** Routes → Controllers → Services → Models
✅ **API Path:** `/api/deals-pipeline/*` (not `/api/leads`)
✅ **Tenant Isolation:** All queries filter by `tenant_id`
✅ **Authentication:** All routes use `jwtAuth`
✅ **No Cross-Feature:** No imports from other features
✅ **Exports:** Use `exports.functionName`

## 🧪 Testing Commands
```bash
# Validate code
./scripts/validate.sh

# Test API endpoint
curl http://localhost:3004/api/deals-pipeline/pipeline/board

# Check file sizes
wc -l backend/features/deals-pipeline/**/*.js
```

## 📝 Common Patterns

### Add New Endpoint
1. Add route in `routes/*.routes.js`
2. Add controller in `controllers/*.controller.js`
3. Add service in `services/*.service.js`
4. Update model if needed

### Example: Add "Get Lead Tags"
```javascript
// 1. routes/leads.routes.js
router.get('/:id/tags', jwtAuth, leadController.getTags);

// 2. controllers/lead.controller.js
exports.getTags = async (req, res) => {
  const tags = await leadService.getTags(req.params.id);
  res.json(tags);
};

// 3. services/lead.service.js
exports.getTags = async (leadId) => {
  return await Lead.getLeadTags(leadId);
};

// 4. models/lead.pg.js
exports.getLeadTags = async (leadId) => {
  const result = await db.query(
    'SELECT * FROM lead_tags WHERE lead_id = $1',
    [leadId]
  );
  return result.rows;
};
```

## 🔍 File Line Counts
```
Routes (6 files):         140 lines total
Controllers (5 files):    343 lines total
Services (5 files):       225 lines total
Total Refactored Code:    708 lines
Original routes.js:       626 lines

Largest file: 98 lines (84% reduction from 626)
```

## 📖 Documentation

- **README.md** - Full guide
- **WORKSPACE_SUMMARY.md** - Complete overview
- **BEFORE_AFTER.md** - Transformation details
- **contracts/api.md** - API reference
- **contracts/data-model.md** - Database schema
- **contracts/feature-rules.md** - Compliance rules

## ⚠️ Common Mistakes

❌ **DON'T:** Put logic in routes
✅ **DO:** Use controllers and services

❌ **DON'T:** Skip tenant_id filtering
✅ **DO:** Always filter: `WHERE tenant_id = $1`

❌ **DON'T:** Import from other features
✅ **DO:** Stay within feature boundaries

❌ **DON'T:** Use `/api/leads`
✅ **DO:** Use `/api/deals-pipeline`

## 🛠️ Troubleshooting

**Validation fails on file size:**
```bash
# Find large files
find . -name "*.js" -exec wc -l {} + | sort -rn | head -10
# Split into smaller modules
```

**Validation fails on cross-feature imports:**
```bash
# Find imports
grep -r "require.*features/" backend --include="*.js" | grep -v deals-pipeline
# Remove or mock dependencies
```

**Database queries missing tenant_id:**
```bash
# Find queries
grep -r "SELECT.*FROM" backend --include="*.js" | grep -v tenant_id
# Add tenant_id filter
```

## 📞 Help

**Check documentation first:**
1. README.md
2. contracts/*.md
3. This quick reference

**Run validation:**
```bash
./scripts/validate.sh
```

**Test locally:**
```bash
./scripts/dev.sh
curl http://localhost:3004/api/deals-pipeline/pipeline/board
```

---

**Version:** 2.0.0 | **Status:** ✅ Production Ready
