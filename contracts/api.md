# API Contract - Deals Pipeline Feature

## Base Path
```
/api/deals-pipeline
```

## Authentication
All endpoints require JWT authentication via `jwtAuth` middleware.

## Leads API

### List Leads
```http
GET /api/deals-pipeline/leads
Query Parameters:
  - stage: string (optional) - Filter by stage key
  - status: string (optional) - Filter by status key
  - search: string (optional) - Search term

Response: Lead[]
```

### Get Lead
```http
GET /api/deals-pipeline/leads/:id
Response: Lead
```

### Create Lead
```http
POST /api/deals-pipeline/leads
Body: {
  name: string (required)
  email: string (optional)
  phone: string (optional)
  company: string (optional)
  value: number (optional)
  stage: string (optional)
  status: string (optional)
  source: string (optional)
  priority: string (optional)
}
Response: Lead
```

### Update Lead
```http
PUT /api/deals-pipeline/leads/:id
Body: Partial<Lead>
Response: Lead
```

### Delete Lead
```http
DELETE /api/deals-pipeline/leads/:id
Response: 204 No Content
```

### Get Lead Stats
```http
GET /api/deals-pipeline/leads/stats
Response: {
  total: number
  byStage: Record<string, number>
  conversionRate: number
}
```

## Stages API

### List Stages
```http
GET /api/deals-pipeline/stages
Response: Stage[]
```

### Create Stage
```http
POST /api/deals-pipeline/stages
Body: {
  key: string (required)
  label: string (required)
  color: string (optional)
  order: number (optional)
}
Response: Stage
```

### Update Stage
```http
PUT /api/deals-pipeline/stages/:key
Body: Partial<Stage>
Response: Stage
```

### Delete Stage
```http
DELETE /api/deals-pipeline/stages/:key
Response: 204 No Content
```

### Reorder Stages
```http
PUT /api/deals-pipeline/stages/reorder
Body: {
  stages: Array<{ key: string, order: number }>
}
Response: Stage[]
```

## Pipeline API

### Get Pipeline Board
```http
GET /api/deals-pipeline/pipeline/board
Response: {
  stages: Stage[]
  leads: Lead[]
  leadsByStage: Record<string, Lead[]>
}
```

### Move Lead to Stage
```http
PUT /api/deals-pipeline/pipeline/leads/:id/stage
Body: {
  stageKey: string (required)
}
Response: Lead
```

### Update Lead Status
```http
PUT /api/deals-pipeline/pipeline/leads/:id/status
Body: {
  statusKey: string (required)
}
Response: Lead
```

## Reference Data API

### Get Statuses
```http
GET /api/deals-pipeline/reference/statuses
Response: Status[]
```

### Get Sources
```http
GET /api/deals-pipeline/reference/sources
Response: Source[]
```

### Get Priorities
```http
GET /api/deals-pipeline/reference/priorities
Response: Priority[]
```

## Attachments API

### List Notes
```http
GET /api/deals-pipeline/leads/:id/notes
Response: Note[]
```

### Create Note
```http
POST /api/deals-pipeline/leads/:id/notes
Body: {
  content: string (required)
  created_by: string (required)
}
Response: Note
```

### Delete Note
```http
DELETE /api/deals-pipeline/leads/:id/notes/:noteId
Response: 204 No Content
```

## Type Definitions

```typescript
interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  value?: number
  stage: string
  status: string
  source?: string
  priority?: string
  created_at: Date
  updated_at: Date
  tenant_id: string
}

interface Stage {
  key: string
  label: string
  color?: string
  order: number
  created_at: Date
  tenant_id: string
}

interface Status {
  key: string
  label: string
  color?: string
}

interface Note {
  id: string
  lead_id: string
  content: string
  created_by: string
  created_at: Date
}
```

## Error Responses

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Status Codes:
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 404: Not Found
- 500: Server Error
