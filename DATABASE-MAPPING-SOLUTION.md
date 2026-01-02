# Database Schema Mapping

## Problem
The database uses different column names than the API:
- DB: `first_name`, `last_name` → API: `name`
- DB: `company_name` → API: `company`
- DB: `estimated_value` → API: `value`
- DB: `priority` (INTEGER 1-4) → API: `priority` (STRING 'low'/'medium'/'high'/'urgent')

## Solution
Added field mapping in **lead.pg.js** model to automatically translate between API and database formats.

### Field Mappings

#### API → Database (for writes)
```javascript
{
  name: 'first_name',         // Stores in first_name column
  company: 'company_name',     // Stores in company_name column
  value: 'estimated_value',    // Stores in estimated_value column
  priority: <converts to int>  // 'low'→1, 'medium'→2, 'high'→3, 'urgent'→4
}
```

#### Database → API (for reads)
```javascript
{
  first_name + last_name: 'name',  // Combines into single name field
  company_name: 'company',          // Returns as company
  estimated_value: 'value',         // Returns as value
  priority (int): <converts to string> // 1→'low', 2→'medium', 3→'high', 4→'urgent'
}
```

### Functions Added
- `mapFieldsToDB(data)` - Converts API field names to database columns before INSERT/UPDATE
- `mapFieldsFromDB(data)` - Converts database columns to API field names after SELECT

### Example Usage

**Creating a lead:**
```javascript
// API sends:
{ name: "John Doe", company: "Acme Corp", priority: "high", value: 50000 }

// Model converts to:
{ first_name: "John Doe", company_name: "Acme Corp", priority: 3, estimated_value: 50000 }

// Database stores it correctly
```

**Reading a lead:**
```javascript
// Database returns:
{ first_name: "John", last_name: "Doe", company_name: "Acme", priority: 3, estimated_value: 50000 }

// Model converts to:
{ name: "John Doe", company: "Acme", priority: "high", value: 50000 }

// API receives correct format
```

### Testing
Try updating a lead now - it should work with the `name` field correctly mapped to `first_name` in the database.

```bash
# Test update endpoint
curl -X PUT http://localhost:3004/api/deals-pipeline/leads/804dea99-b693-4125-a0ee-8bfae2e4e239 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","company":"Updated Company","priority":"high"}'
```

### Database Schema Unchanged
✅ No database changes required  
✅ Backward compatible with existing data  
✅ Works with current table structure  
✅ All existing leads remain accessible
