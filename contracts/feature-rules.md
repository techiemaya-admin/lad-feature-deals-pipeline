# Feature Rules - Deals Pipeline

## LAD Compliance Rules

### 1. File Size Limits
- ❌ No file > 400 lines
- ✅ routes.js split into 6 files (each < 150 lines)
- ✅ Controllers < 100 lines each
- ✅ Services < 150 lines each

### 2. Architecture Pattern
**MANDATORY:** Routes → Controllers → Services → Models

```javascript
// ✅ CORRECT
// routes/leads.routes.js
router.get('/', jwtAuth, leadController.list);

// controllers/lead.controller.js
exports.list = async (req, res) => {
  const leads = await leadService.list(req.query);
  res.json(leads);
};

// services/lead.service.js
exports.list = async (filters) => {
  return await Lead.listLeads(filters);
};

// ❌ WRONG - Business logic in routes
router.get('/', jwtAuth, async (req, res) => {
  const leads = await Lead.listLeads();
  res.json(leads);
});
```

### 3. No Cross-Feature Dependencies
```javascript
// ❌ FORBIDDEN
const userService = require('../../users/services/user.service');
const billingService = require('../../billing/services/billing.service');

// ✅ ALLOWED (within same feature)
const leadService = require('../services/lead.service');
```

### 4. Tenant Isolation
```javascript
// ✅ CORRECT
WHERE tenant_id = $1

// ❌ FORBIDDEN
SELECT * FROM leads  -- Missing tenant_id filter
```

### 5. No Frontend Logic
```javascript
// ❌ FORBIDDEN - UI logic in backend
const formatLeadName = (lead) => `${lead.firstName} ${lead.lastName}`;

// ✅ CORRECT - Pure data
return { firstName: lead.firstName, lastName: lead.lastName };
```

### 6. API Path Consistency
**Base Path:** `/api/deals-pipeline`

```javascript
// ✅ CORRECT
/api/deals-pipeline/leads
/api/deals-pipeline/stages
/api/deals-pipeline/pipeline/board

// ❌ WRONG - Old pattern
/api/leads
/api/leads/stages
```

### 7. No Shared State
```javascript
// ❌ FORBIDDEN
let cachedLeads = [];  // Global state

// ✅ CORRECT
// Use database or proper caching layer
```

### 8. Error Handling
```javascript
// ✅ CORRECT
try {
  const lead = await leadService.getById(id);
  res.json(lead);
} catch (error) {
  console.error('[Lead Controller]', error);
  res.status(500).json({ 
    error: 'Failed to fetch lead',
    details: error.message 
  });
}

// ❌ WRONG - Exposing internal errors
res.status(500).send(error);
```

### 9. Authentication
```javascript
// ✅ MANDATORY
router.get('/', jwtAuth, controller.list);

// ❌ FORBIDDEN - No unprotected routes
router.get('/', controller.list);
```

### 10. Response Format
```javascript
// ✅ CORRECT
res.json({ data: leads, total: count });
res.status(201).json(newLead);
res.status(204).send();

// ❌ WRONG
res.send('OK');
res.json({ success: true, data: leads });  // Unnecessary wrapper
```

## Testing Rules

1. **Unit Tests:** Each service must have unit tests
2. **Integration Tests:** Each route must have integration tests
3. **No Test Pollution:** Tests must not affect other features
4. **Mock External Deps:** Use mocks for auth, billing, etc.

## Development Rules

1. **No Commented Code:** Delete, don't comment
2. **Meaningful Names:** No `temp`, `data`, `result` without context
3. **Single Responsibility:** Each function does ONE thing
4. **Early Returns:** Avoid deep nesting

```javascript
// ✅ CORRECT
if (!lead) return res.status(404).json({ error: 'Not found' });
res.json(lead);

// ❌ WRONG
if (lead) {
  res.json(lead);
} else {
  res.status(404).json({ error: 'Not found' });
}
```

## Documentation Rules

1. **JSDoc for Public APIs:** Controllers and services
2. **Inline Comments:** Only for complex logic
3. **README:** Keep updated with changes

## Version Control Rules

1. **Atomic Commits:** One logical change per commit
2. **Descriptive Messages:** "Fix lead creation bug" not "fix"
3. **No Direct Pushes:** Use branches and PRs

## Security Rules

1. **Input Validation:** Validate all user input
2. **SQL Injection:** Use parameterized queries
3. **Authentication:** Every route must check auth
4. **Authorization:** Check tenant access
5. **Sensitive Data:** Never log passwords, tokens, etc.

## Performance Rules

1. **Avoid N+1 Queries:** Use JOIN or Promise.all
2. **Pagination:** For large result sets
3. **Caching:** For reference data
4. **Indexes:** On frequently queried fields
