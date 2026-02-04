# Education Vertical - Quick Reference

## 📁 New Files Created

```
backend/features/deals-pipeline/
├── constants/
│   └── educationConstants.js          ✨ NEW - Education enums & validation
├── dtos/
│   └── studentDto.js                  ✨ NEW - API ↔ DB transformations
├── repositories/
│   └── leadsRepository.js             ✨ NEW - Lead SQL queries
├── utils/
│   └── tenantHelpers.js               ✨ NEW - Feature flag validation
└── validators/
    └── student.validator.js           ✏️ ENHANCED - Joi validation schemas
```

## ✏️ Enhanced Files

```
backend/features/deals-pipeline/
├── controllers/
│   └── student.controller.js          ✏️ ENHANCED - Added DTOs & validators
├── services/
│   └── students.service.js            ✏️ ENHANCED - Added tenant validation
└── routes/
    ├── student.routes.js              ✏️ ENHANCED - Added middleware
    └── index.js                       ✏️ ENHANCED - Registered student routes
```

## 🔧 Key Functions

### Tenant Validation
```javascript
const { requireEducationTenant } = require('./utils/tenantHelpers');

// Use in services
await requireEducationTenant(tenantId, schema);
// Throws 403 if tenant doesn't have education vertical
```

### DTO Transformations
```javascript
const { studentToApi, studentFromApi } = require('./dtos/studentDto');

// DB → API
const apiResponse = studentToApi(dbStudent);

// API → DB
const { leadData, studentData } = studentFromApi(apiRequest);
```

### Validation
```javascript
const { validateCreate, validateUpdate } = require('./validators/student.validator');

// Validate input
const { error, value } = validateCreate(req.body);
if (error) {
  return res.status(400).json({ error: error.details });
}
```

## 🚀 API Endpoints

```
Base: /api/deals-pipeline/students

GET    /                       - List students (counsellor scoped)
GET    /:id                    - Get student by ID
POST   /                       - Create student
PUT    /:id                    - Update student
DELETE /:id                    - Soft delete student
POST   /:id/assign-counsellor  - Assign counsellor (admin only)
```

## 🔐 Capabilities Required

```javascript
'education.students.view'      // View students
'education.students.create'    // Create students
'education.students.edit'      // Update students
'education.students.delete'    // Delete students
'education.students.assign'    // Assign counsellors
'education.admin'              // Full admin access
'leads.view_assigned'          // Counsellor scoping
'canViewAll'                   // Admin view all
```

## 🎯 LAD Architecture Checklist

- ✅ Controllers: Request/response only
- ✅ Services: Business logic only
- ✅ Repositories: SQL only
- ✅ No hardcoded schemas (uses `${schema}`)
- ✅ Tenant isolation (`WHERE tenant_id = $1`)
- ✅ Soft deletes (`AND is_deleted = false`)
- ✅ Structured logging with context
- ✅ Error codes (EDUCATION_NOT_ENABLED, STUDENT_NOT_FOUND, etc.)
- ✅ Input validation (Joi schemas)
- ✅ DTOs (API ↔ DB mapping)

## 🧪 Quick Test

```bash
# Test list students (should require education vertical)
curl -X GET http://localhost:3000/api/deals-pipeline/students \
  -H "Authorization: Bearer <token>"

# Test create student
curl -X POST http://localhost:3000/api/deals-pipeline/students \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "test@example.com",
    "current_education_level": "bachelors",
    "target_degree": "masters",
    "target_major": "Computer Science"
  }'
```

## 🐛 Troubleshooting

### Error: "Education vertical not enabled"
- Check tenant vertical: `SELECT vertical FROM tenants WHERE id = '<tenant-id>';`
- Or enable feature: `INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES ('<tenant-id>', 'education_vertical', true);`

### Error: "Validation failed"
- Check Joi validation rules in `validators/student.validator.js`
- Ensure required fields: `name`, `email`
- Check test score ranges (e.g., SAT: 400-1600)

### Error: "Student not found"
- Verify student exists: `SELECT * FROM education_students WHERE lead_id = '<lead-id>';`
- Check tenant_id matches
- Check is_deleted = false

## 📊 Database Queries

```sql
-- Check if tenant is education vertical
SELECT vertical, settings FROM tenants WHERE id = '<tenant-id>';

-- Get all students for tenant
SELECT es.*, l.name, l.email 
FROM education_students es
JOIN leads l ON l.id = es.lead_id
WHERE es.tenant_id = '<tenant-id>' AND es.is_deleted = false;

-- Enable education vertical
UPDATE tenants SET vertical = 'education' WHERE id = '<tenant-id>';

-- Or use feature flags
INSERT INTO tenant_features (tenant_id, feature_key, enabled)
VALUES ('<tenant-id>', 'education_vertical', true);
```

## 📚 Documentation

- Full Implementation: [EDUCATION-VERTICAL-IMPLEMENTATION.md](./EDUCATION-VERTICAL-IMPLEMENTATION.md)
- Blueprint: [vertical-pipeline-blueprint.md](./vertical-pipeline-blueprint.md)
- Feature Capabilities: [FEATURE-CAPABILITIES.md](./FEATURE-CAPABILITIES.md)
- API Contract: [contracts/api.md](./contracts/api.md)
