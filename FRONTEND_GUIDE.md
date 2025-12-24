# Frontend Developer Guide - Deals Pipeline

> Complete guide for frontend developers integrating with the Deals Pipeline feature

## 🎯 Overview

This workspace provides:
- ✅ **TypeScript SDK** - Type-safe API client
- ✅ **React Hooks** - Ready-to-use hooks for data fetching
- ✅ **Example Components** - Reference implementation
- ✅ **Type Definitions** - Full TypeScript support

## 🚀 Quick Start (Frontend)

### 1. Backend Running?

Make sure the backend is running:
```bash
# In the workspace root
npm run dev
```

You should see:
```
📡 Server running at: http://localhost:3004
```

### 2. Import the SDK

```typescript
import { dealsPipelineAPI } from './frontend/sdk/features/deals-pipeline/api';

// Fetch data
const board = await dealsPipelineAPI.getPipelineBoard();
console.log(board);
```

### 3. Use React Hooks

```typescript
import { usePipelineBoard } from './frontend/sdk/features/deals-pipeline/hooks';

function MyComponent() {
  const { data, loading, error } = usePipelineBoard();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.stages.map(stage => (
        <div key={stage.key}>{stage.label}</div>
      ))}
    </div>
  );
}
```

## 📦 SDK Features

### API Client

Location: `frontend/sdk/features/deals-pipeline/api.ts`

**Features:**
- ✅ Type-safe methods for all endpoints
- ✅ Automatic error handling
- ✅ Bearer token authentication
- ✅ No external dependencies

**Example:**
```typescript
import { DealsPipelineAPI } from './frontend/sdk/features/deals-pipeline/api';

const api = new DealsPipelineAPI();

// Set auth token
api.setAuthToken('your-jwt-token');

// Create a lead
const lead = await api.createLead({
  name: 'John Doe',
  email: 'john@example.com',
  value: 50000
});

// Get pipeline board
const board = await api.getPipelineBoard();
```

### React Hooks

Location: `frontend/sdk/features/deals-pipeline/hooks.ts`

**Available Hooks:**
- `usePipelineBoard()` - Full pipeline data
- `useLeads(filters?)` - List of leads
- `useLead(id)` - Single lead
- `useStages()` - Pipeline stages
- `useLeadMutations()` - Create/update/delete
- `useReferenceData()` - Statuses, sources, priorities
- `useLeadStats()` - Statistics

**Example:**
```typescript
import { usePipelineBoard, useLeadMutations } from './frontend/sdk/features/deals-pipeline/hooks';

function Pipeline() {
  const { data: board, loading, refetch } = usePipelineBoard();
  const { createLead, moveLeadToStage } = useLeadMutations();

  const handleCreate = async () => {
    await createLead({ name: 'New Lead' });
    refetch(); // Reload data
  };

  return <div>{/* ... */}</div>;
}
```

### Type Definitions

Location: `frontend/sdk/features/deals-pipeline/types.ts`

**All types exported:**
```typescript
import type {
  Lead,
  Stage,
  Status,
  PipelineBoard,
  CreateLeadPayload,
  UpdateLeadPayload
} from './frontend/sdk/features/deals-pipeline/types';
```

## 🎨 Example Components

### Complete Pipeline Board

Location: `ui/pipeline/Board.tsx`

**Features:**
- Kanban-style board with stages
- Drag-and-drop lead movement
- Create lead modal
- Delete lead confirmation
- Responsive design

**How to use:**
```typescript
import { PipelineBoard } from './ui/pipeline/Board';

function App() {
  return <PipelineBoard />;
}
```

## 📚 Common Use Cases

### 1. Display Pipeline Board

```typescript
import { usePipelineBoard } from './frontend/sdk/features/deals-pipeline/hooks';

function Board() {
  const { data, loading, error } = usePipelineBoard();
  
  return (
    <div className="pipeline">
      {data?.stages.map(stage => (
        <div key={stage.key} className="stage">
          <h3>{stage.label}</h3>
          {data.leadsByStage[stage.key]?.map(lead => (
            <div key={lead.id} className="lead-card">
              {lead.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 2. Create Lead Form

```typescript
import { useLeadMutations, useStages } from './frontend/sdk/features/deals-pipeline/hooks';

function CreateLeadForm() {
  const { createLead, loading } = useLeadMutations();
  const { data: stages } = useStages();
  const [name, setName] = useState('');
  const [stage, setStage] = useState('new');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createLead({ name, stage });
    alert('Lead created!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Lead name"
      />
      <select value={stage} onChange={e => setStage(e.target.value)}>
        {stages?.map(s => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### 3. Lead Details Page

```typescript
import { useLead } from './frontend/sdk/features/deals-pipeline/hooks';

function LeadDetails({ id }: { id: string }) {
  const { data: lead, loading, error } = useLead(id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!lead) return <div>Lead not found</div>;

  return (
    <div>
      <h1>{lead.name}</h1>
      <p>Company: {lead.company}</p>
      <p>Value: ${lead.value?.toLocaleString()}</p>
      <p>Stage: {lead.stage}</p>
      <p>Status: {lead.status}</p>
    </div>
  );
}
```

### 4. Move Lead Between Stages

```typescript
import { useLeadMutations } from './frontend/sdk/features/deals-pipeline/hooks';

function LeadCard({ lead, onMove }) {
  const { moveLeadToStage, loading } = useLeadMutations();

  const handleMove = async (newStage: string) => {
    await moveLeadToStage(lead.id, newStage);
    onMove(); // Callback to refresh data
  };

  return (
    <div>
      <h3>{lead.name}</h3>
      <button onClick={() => handleMove('qualified')} disabled={loading}>
        Move to Qualified
      </button>
    </div>
  );
}
```

### 5. Statistics Dashboard

```typescript
import { useLeadStats } from './frontend/sdk/features/deals-pipeline/hooks';

function Dashboard() {
  const { data: stats, loading } = useLeadStats();

  return (
    <div className="dashboard">
      <div className="stat-card">
        <h3>Total Leads</h3>
        <p>{stats?.total}</p>
      </div>
      <div className="stat-card">
        <h3>Conversion Rate</h3>
        <p>{stats?.conversionRate}%</p>
      </div>
      <div className="stages-breakdown">
        {Object.entries(stats?.byStage || {}).map(([stage, count]) => (
          <div key={stage}>
            <span>{stage}</span>: <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 Configuration

### Custom API URL

```typescript
import { DealsPipelineAPI } from './frontend/sdk/features/deals-pipeline/api';

// For production
const api = new DealsPipelineAPI('https://api.yourdomain.com/api/deals-pipeline');

// Use with hooks
import { usePipelineBoard } from './frontend/sdk/features/deals-pipeline/hooks';

function Component() {
  const { data } = usePipelineBoard({ api });
  return <div>{data?.stages.length} stages</div>;
}
```

### Authentication

```typescript
import { dealsPipelineAPI } from './frontend/sdk/features/deals-pipeline/api';

// Set token once (e.g., after login)
dealsPipelineAPI.setAuthToken(userToken);

// All subsequent calls will include the token
const leads = await dealsPipelineAPI.listLeads();
```

## 🎨 Styling

The example components use Tailwind CSS classes. You can:

1. **Use Tailwind**: Install Tailwind CSS
2. **Use Custom CSS**: Replace classes with your own
3. **Use CSS-in-JS**: Convert to styled-components, emotion, etc.

Example without Tailwind:
```typescript
// Instead of:
<div className="bg-white rounded-lg p-4">

// Use:
<div style={{ background: 'white', borderRadius: '8px', padding: '16px' }}>
```

## 📱 Framework Integration

### Next.js

```typescript
// pages/pipeline.tsx
import { PipelineBoard } from '../ui/pipeline/Board';

export default function PipelinePage() {
  return <PipelineBoard />;
}
```

### Vite + React

```typescript
// src/App.tsx
import { PipelineBoard } from './ui/pipeline/Board';

function App() {
  return (
    <div className="App">
      <PipelineBoard />
    </div>
  );
}
```

### Vue.js

While the hooks are React-specific, you can use the API client directly:

```typescript
// Vue component
import { dealsPipelineAPI } from './frontend/sdk/features/deals-pipeline/api';

export default {
  data() {
    return {
      board: null,
      loading: true
    }
  },
  async mounted() {
    this.board = await dealsPipelineAPI.getPipelineBoard();
    this.loading = false;
  }
}
```

## 🧪 Testing

### Test with Mock Data

```typescript
import { DealsPipelineAPI } from './frontend/sdk/features/deals-pipeline/api';

// Create mock API
class MockAPI extends DealsPipelineAPI {
  async getPipelineBoard() {
    return {
      stages: [{ key: 'new', label: 'New', order: 1 }],
      leads: [{ id: '1', name: 'Test Lead', stage: 'new' }],
      leadsByStage: { new: [{ id: '1', name: 'Test Lead' }] }
    };
  }
}

// Use in tests
const mockAPI = new MockAPI();
const board = await mockAPI.getPipelineBoard();
```

## 📖 Additional Resources

- **SDK Documentation**: [frontend/sdk/features/deals-pipeline/README.md](frontend/sdk/features/deals-pipeline/README.md)
- **API Reference**: [contracts/api.md](contracts/api.md)
- **Type Definitions**: [frontend/sdk/features/deals-pipeline/types.ts](frontend/sdk/features/deals-pipeline/types.ts)
- **Example Component**: [ui/pipeline/Board.tsx](ui/pipeline/Board.tsx)

## 🚨 Common Issues

### CORS Errors

If you see CORS errors:
```
Access to fetch at 'http://localhost:3004' has been blocked by CORS policy
```

**Solution**: The backend has CORS enabled. Make sure:
1. Backend is running
2. You're using the correct URL
3. Check browser console for details

### Type Errors

```typescript
// ❌ Wrong
const lead = await api.getLead(123); // number instead of string

// ✅ Correct
const lead = await api.getLead('123'); // string
```

### Hook Updates Not Working

```typescript
// ❌ Won't update
const { data } = usePipelineBoard();
await api.createLead({...});
// data is stale

// ✅ Will update
const { data, refetch } = usePipelineBoard();
await api.createLead({...});
refetch(); // Reload data
```

## 💡 Tips

1. **Always call `refetch()`** after mutations to update UI
2. **Handle loading states** to improve UX
3. **Handle errors gracefully** with try/catch
4. **Use TypeScript** to catch errors at compile time
5. **Check backend is running** before testing frontend

## 🎯 Next Steps

1. ✅ Backend running? → `npm run dev`
2. ✅ Import SDK → `import { dealsPipelineAPI } from '...'`
3. ✅ Use hooks → `const { data } = usePipelineBoard()`
4. ✅ Build your UI → Use example components as reference
5. ✅ Deploy → Configure production API URL

---

**Need Help?**
- Check [SDK README](frontend/sdk/features/deals-pipeline/README.md)
- Review [example component](ui/pipeline/Board.tsx)
- Test API with curl: `curl http://localhost:3004/api/deals-pipeline/pipeline/board`
