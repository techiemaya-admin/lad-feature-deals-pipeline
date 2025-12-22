# Deals Pipeline Events

> Domain events published by the deals-pipeline feature

## Overview

This feature publishes events that other features can subscribe to. Events are one-way notifications that maintain loose coupling between features.

## Event Naming Convention

```
deals-pipeline.{entity}.{action}
```

## Published Events

### Lead Events

#### `deals-pipeline.lead.created`

**When:** A new lead is created in the pipeline

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.lead.created',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    leadId: 'uuid',
    name: string,
    email: string | null,
    company: string | null,
    stage: string,
    status: string,
    value: number | null,
    source: string | null,
    priority: string,
    createdBy: 'uuid'
  }
}
```

**Use Cases:**
- Notify CRM when a new lead enters the pipeline
- Trigger welcome email automation
- Update analytics dashboards

---

#### `deals-pipeline.lead.updated`

**When:** Lead details are modified

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.lead.updated',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    leadId: 'uuid',
    changes: {
      field: string,
      oldValue: any,
      newValue: any
    }[],
    updatedBy: 'uuid'
  }
}
```

---

#### `deals-pipeline.lead.stage-changed`

**When:** Lead moves to a different stage in the pipeline

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.lead.stage-changed',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    leadId: 'uuid',
    leadName: string,
    fromStage: string,
    toStage: string,
    value: number | null,
    movedBy: 'uuid',
    reason: string | null
  }
}
```

**Use Cases:**
- Trigger stage-specific workflows
- Send notifications to sales team
- Update forecasting models
- Log activity timeline

---

#### `deals-pipeline.lead.status-changed`

**When:** Lead status changes (active, won, lost, etc.)

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.lead.status-changed',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    leadId: 'uuid',
    leadName: string,
    fromStatus: string,
    toStatus: string,
    value: number | null,
    reason: string | null,
    changedBy: 'uuid'
  }
}
```

**Use Cases:**
- Celebrate won deals
- Analyze lost deal patterns
- Update revenue reports

---

#### `deals-pipeline.lead.deleted`

**When:** A lead is removed from the pipeline

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.lead.deleted',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    leadId: 'uuid',
    leadName: string,
    stage: string,
    status: string,
    deletedBy: 'uuid',
    reason: string | null
  }
}
```

---

### Stage Events

#### `deals-pipeline.stage.reordered`

**When:** Pipeline stages are reordered

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.stage.reordered',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    stages: {
      key: string,
      oldPosition: number,
      newPosition: number
    }[],
    reorderedBy: 'uuid'
  }
}
```

---

### Pipeline Events

#### `deals-pipeline.value-milestone`

**When:** Total pipeline value crosses a significant threshold

**Payload:**
```typescript
{
  eventType: 'deals-pipeline.value-milestone',
  timestamp: '2025-12-22T10:30:00Z',
  tenantId: 'uuid',
  data: {
    milestone: number,
    currentValue: number,
    leadCount: number
  }
}
```

**Use Cases:**
- Celebrate team achievements
- Send executive notifications
- Trigger incentive programs

---

## Event Subscription Rules

### ✅ Allowed Subscribers

Other features can subscribe to these events for:
- Notifications
- Analytics
- Workflow automation
- Audit logging

### ❌ Prohibited Actions

Subscribers **MUST NOT**:
- Modify deals-pipeline data directly
- Call deals-pipeline APIs synchronously from event handlers
- Create circular event dependencies
- Block event processing with long-running operations

### Best Practices

1. **Idempotency**: Handle duplicate events gracefully
2. **Async Processing**: Process events asynchronously
3. **Error Handling**: Log failures, don't break the publisher
4. **Versioning**: Include event schema version for backward compatibility

## Event Schema Version

Current Version: **v1**

```typescript
interface BaseEvent {
  eventType: string;
  timestamp: string;      // ISO 8601
  tenantId: string;       // UUID
  schemaVersion: 'v1';
  data: object;
}
```

## Future Events (Planned)

- `deals-pipeline.lead.assigned` - Lead assigned to a user
- `deals-pipeline.lead.priority-changed` - Priority updated
- `deals-pipeline.lead.note-added` - Note/comment added
- `deals-pipeline.attachment.uploaded` - File attached to lead
- `deals-pipeline.stage.created` - New stage added
- `deals-pipeline.stage.archived` - Stage removed from pipeline

---

## Implementation Notes

### Publishing Events

Events should be published from **service layer** only, not controllers:

```javascript
// ✅ Correct - in service
async moveLead(leadId, toStage) {
  const lead = await this.updateStage(leadId, toStage);
  
  await eventBus.publish({
    eventType: 'deals-pipeline.lead.stage-changed',
    timestamp: new Date().toISOString(),
    tenantId: lead.tenantId,
    data: {
      leadId: lead.id,
      fromStage: lead.previousStage,
      toStage: lead.stage
    }
  });
  
  return lead;
}
```

### Event Bus

The event bus is provided by the core platform:

```javascript
const { eventBus } = require('../../../core/events');
```

For isolated development, use the mock event bus:

```javascript
const { mockEventBus } = require('../../../mocks/events.mock');
```

---

## Questions?

See: [Feature Rules](./feature-rules.md) for event publishing guidelines.
