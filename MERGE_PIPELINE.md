# Merge Pipeline Guide
## Feature Repo → Main LAD Repo (develop branch)

**Feature Repo:** https://github.com/techiemaya-admin/lad-feature-deals-pipeline  
**Main LAD Repo:** (to be configured)  
**Target Branch:** `develop`

---

## 🎯 Overview

This guide helps you merge the deals-pipeline feature from its isolated feature repository into the main LAD repository's `develop` branch.

### Key Principles
✅ Feature repo stays isolated during development  
✅ Main LAD repo receives tested, production-ready code  
✅ No breaking changes to existing LAD features  
✅ All tests pass before merge  

---

## 📋 Prerequisites

### 1. Setup Main LAD Repo
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD
git init
git remote add origin <MAIN_LAD_REPO_URL>
git fetch origin
git checkout -b develop origin/develop
```

### 2. Verify Feature Repo is Clean
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/lad-feature-deals-pipeline
git status
npm test  # Ensure all tests pass
./scripts/validate.sh  # Verify LAD compliance
```

---

## 🔄 Merge Methods

### **Method 1: Manual Copy (Recommended for First Merge)**

This method gives you full control and lets you review every file.

#### Step 1: Create Feature Branch in Main Repo
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD
git checkout develop
git pull origin develop
git checkout -b feature/deals-pipeline-integration
```

#### Step 2: Copy Feature Files
```bash
# From feature repo, copy to main LAD repo
cd /Users/naveenreddy/Desktop/AI-Maya

# Copy backend feature
cp -r lad-feature-deals-pipeline/backend/features/deals-pipeline \
      LAD/backend/features/

# Copy shared utilities (if any)
cp -r lad-feature-deals-pipeline/backend/shared/database \
      LAD/backend/shared/

# Copy frontend SDK
cp -r lad-feature-deals-pipeline/frontend/sdk/features/deals-pipeline \
      LAD/frontend/sdk/features/

# Copy contracts
mkdir -p LAD/contracts/deals-pipeline
cp -r lad-feature-deals-pipeline/contracts/* \
      LAD/contracts/deals-pipeline/
```

#### Step 3: Integration Checklist
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD

# 1. Update main server.js to mount the feature
# Edit: backend/core/app.js or backend/server.js
```

**Add to server:**
```javascript
// Mount deals-pipeline feature
const dealsPipelineRouter = require('./features/deals-pipeline/routes');
app.use('/api/deals-pipeline', dealsPipelineRouter);
```

**2. Register feature in feature registry:**
```bash
# Edit: backend/core/feature_registry.js
```

```javascript
const features = {
  // ... existing features
  'deals-pipeline': {
    name: 'Deals Pipeline',
    version: '2.0.0',
    routes: '/api/deals-pipeline',
    manifest: require('../features/deals-pipeline/manifest')
  }
};
```

**3. Add dependencies to main package.json:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}
```

**4. Run database migrations:**
```bash
# Copy migration files
cp lad-feature-deals-pipeline/contracts/database-schema.sql \
   LAD/backend/migrations/007_deals_pipeline.sql

# Run migration
npm run migrate
```

#### Step 4: Test Integration
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD

# Install dependencies
npm install

# Start backend
npm run dev:backend

# Test endpoints
curl http://localhost:3004/api/deals-pipeline/health
curl http://localhost:3004/api/deals-pipeline/leads
```

#### Step 5: Commit and Push
```bash
git add backend/features/deals-pipeline
git add frontend/sdk/features/deals-pipeline
git add contracts/deals-pipeline
git add backend/migrations/007_deals_pipeline.sql
git commit -m "feat: integrate deals-pipeline feature

- Add deals pipeline feature with routes, controllers, services
- Add frontend SDK for deals-pipeline
- Add database migrations for leads, stages, pipeline
- Register feature in feature registry
- Version: 2.0.0"

git push origin feature/deals-pipeline-integration
```

#### Step 6: Create Pull Request
1. Go to GitHub main LAD repo
2. Create PR: `feature/deals-pipeline-integration` → `develop`
3. Request reviews
4. Wait for CI/CD checks to pass
5. Merge to develop

---

### **Method 2: Git Subtree (For Ongoing Syncs)**

Use this method for subsequent updates after the initial merge.

#### Initial Setup
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD
git checkout develop

# Add feature repo as remote
git remote add feature-deals-pipeline \
  https://github.com/techiemaya-admin/lad-feature-deals-pipeline.git

git fetch feature-deals-pipeline
```

#### Merge Updates
```bash
# Merge latest changes from feature repo
git subtree pull --prefix=backend/features/deals-pipeline \
  feature-deals-pipeline main --squash

# Or specific files
git subtree pull --prefix=frontend/sdk/features/deals-pipeline \
  feature-deals-pipeline main --squash
```

#### Push Changes Back to Feature Repo
```bash
# If you make updates in main LAD that should go back to feature
git subtree push --prefix=backend/features/deals-pipeline \
  feature-deals-pipeline main
```

---

### **Method 3: GitHub Actions CI/CD (Automated)**

Create automated pipeline for continuous integration.

#### Create `.github/workflows/merge-feature.yml` in Feature Repo

```yaml
name: Merge to Main LAD Repo

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test-and-merge:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Feature Repo
        uses: actions/checkout@v3
        with:
          path: feature-repo
      
      - name: Checkout Main LAD Repo
        uses: actions/checkout@v3
        with:
          repository: techiemaya-admin/LAD  # Update with actual repo
          token: ${{ secrets.LAD_REPO_TOKEN }}
          path: main-repo
          ref: develop
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run Tests in Feature Repo
        working-directory: ./feature-repo
        run: |
          npm install
          npm test
          ./scripts/validate.sh
      
      - name: Copy Feature to Main Repo
        run: |
          # Copy backend
          cp -r feature-repo/backend/features/deals-pipeline \
                main-repo/backend/features/
          
          # Copy frontend
          cp -r feature-repo/frontend/sdk/features/deals-pipeline \
                main-repo/frontend/sdk/features/
          
          # Copy contracts
          mkdir -p main-repo/contracts/deals-pipeline
          cp -r feature-repo/contracts/* \
                main-repo/contracts/deals-pipeline/
      
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          path: main-repo
          token: ${{ secrets.LAD_REPO_TOKEN }}
          commit-message: 'feat: sync deals-pipeline from feature repo'
          branch: feature/deals-pipeline-sync
          base: develop
          title: '[Auto] Sync Deals Pipeline Feature'
          body: |
            ## Automated Feature Sync
            
            Syncing deals-pipeline feature from feature repository.
            
            **Source:** https://github.com/techiemaya-admin/lad-feature-deals-pipeline
            **Commit:** ${{ github.sha }}
            
            ### Changes
            - Backend: `/backend/features/deals-pipeline`
            - Frontend: `/frontend/sdk/features/deals-pipeline`
            - Contracts: `/contracts/deals-pipeline`
            
            ### Tests
            ✅ Feature repo tests passed
            ✅ LAD compliance validation passed
```

#### Setup GitHub Secrets
1. Go to Feature Repo Settings → Secrets
2. Add `LAD_REPO_TOKEN`: GitHub Personal Access Token with `repo` access

---

## 🧪 Testing Strategy

### Before Merge
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/lad-feature-deals-pipeline

# 1. Run unit tests
npm test

# 2. Run LAD compliance validation
./scripts/validate.sh

# 3. Check for breaking changes
npm run lint

# 4. Test API endpoints
./tests/run-all-tests.sh
```

### After Integration (In Main Repo)
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD

# 1. Install and test
npm install
npm test

# 2. Test feature in isolation
npm run test:feature deals-pipeline

# 3. Integration tests
npm run test:integration

# 4. Start server and manual test
npm run dev
# Visit: http://localhost:3004/api/deals-pipeline/health
```

---

## 🔍 Integration Points

### Files to Update in Main LAD Repo

1. **`backend/core/app.js`** or **`backend/server.js`**
   - Mount deals-pipeline router
   - Add health check

2. **`backend/core/feature_registry.js`**
   - Register deals-pipeline feature
   - Add manifest reference

3. **`backend/package.json`**
   - Merge dependencies from feature repo

4. **`backend/migrations/`**
   - Add `007_deals_pipeline.sql`

5. **`frontend/web/src/routes/`** (if applicable)
   - Add deals-pipeline routes

6. **`.env.example`**
   - Add any new environment variables

---

## 🚨 Common Issues & Solutions

### Issue 1: Path Conflicts
**Problem:** Files already exist in main repo  
**Solution:**
```bash
# Backup existing
mv LAD/backend/features/deals-pipeline \
   LAD/backend/features/deals-pipeline.backup

# Copy new version
cp -r lad-feature-deals-pipeline/backend/features/deals-pipeline \
      LAD/backend/features/
```

### Issue 2: Database Migration Conflicts
**Problem:** Migration numbers conflict  
**Solution:** Rename migration file to next available number
```bash
# Check last migration
ls LAD/backend/migrations/ | sort | tail -1
# If last is 006_*, rename to 007_*
```

### Issue 3: Dependency Conflicts
**Problem:** Package versions differ  
**Solution:** Use version ranges in package.json
```json
{
  "pg": "^8.11.3"  // Allows 8.11.x
}
```

### Issue 4: Test Failures After Merge
**Problem:** Tests fail in main repo  
**Solution:**
```bash
# Check for missing test dependencies
npm install --save-dev jest typescript

# Run tests with verbose output
npm test -- --verbose

# Check mock data paths
# Feature repo: mocks/auth.mock.js
# Main repo: backend/shared/mocks/auth.mock.js
```

---

## 📊 Verification Checklist

After merge, verify:

- [ ] Feature accessible at `/api/deals-pipeline`
- [ ] Health check returns 200: `/api/deals-pipeline/health`
- [ ] All routes require authentication
- [ ] Database migrations applied successfully
- [ ] Frontend SDK imports work
- [ ] No cross-feature imports
- [ ] All tests pass
- [ ] LAD compliance validation passes
- [ ] No console errors in development
- [ ] Documentation updated

---

## 🔄 Ongoing Sync Process

### When Feature Repo Updates

1. **Pull changes in feature repo:**
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/lad-feature-deals-pipeline
git pull origin main
```

2. **Test changes:**
```bash
npm test
./scripts/validate.sh
```

3. **Copy to main repo:**
```bash
cd /Users/naveenreddy/Desktop/AI-Maya/LAD
git checkout -b feature/deals-pipeline-update-YYYYMMDD

# Copy updated files
cp -r ../lad-feature-deals-pipeline/backend/features/deals-pipeline/* \
      backend/features/deals-pipeline/
```

4. **Test integration:**
```bash
npm test
npm run dev
```

5. **Create PR and merge**

---

## 🎨 Frontend Development Workflow

### Overview

**⚠️ IMPORTANT:** The deals-pipeline frontend SDK already exists in the main LAD repo at:
- **Location:** `LAD/frontend/sdk/features/pipeline/`
- **Repo:** https://github.com/techiemaya-admin/LAD-Frontend

The feature repo's frontend SDK is for **testing backend APIs only**. Production frontend development happens in the main LAD-Frontend repo.

---

### For Frontend Developers

#### Step 1: Clone Frontend Repo

```bash
# Clone the main LAD frontend repository
git clone https://github.com/techiemaya-admin/LAD-Frontend.git
cd LAD-Frontend
```

#### Step 2: Create Feature Branch (LAD Rule)

**🚫 NEVER push directly to `develop`**

```bash
# Always create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/pipeline-ui-enhancements
```

#### Step 3: Understand the Structure

```
LAD-Frontend/
├── sdk/features/pipeline/          # SDK Layer (TypeScript)
│   ├── services/                   # API calls to backend
│   │   ├── api.ts
│   │   └── pipelineService.ts
│   ├── store/slices/               # Redux state management
│   │   ├── pipelineSlice.ts
│   │   └── masterDataSlice.ts
│   ├── components/                 # Shared UI components
│   ├── utils/                      # Helper functions
│   ├── types.ts                    # TypeScript types
│   └── index.ts                    # Public exports
│
└── web/src/
    ├── app/pipeline/               # Next.js page route
    │   ├── page.tsx                # /pipeline page
    │   └── loading.tsx
    └── components/pipeline/        # Page-specific components
        └── PipelineBoard.tsx       # Main pipeline UI
```

#### Step 4: Make Changes

**Backend API Integration:**
```typescript
// sdk/features/pipeline/services/api.ts
import { apiClient } from '@/lib/api';

export const pipelineAPI = {
  // Add new endpoints that call backend
  async getLeads() {
    const response = await apiClient.get('/api/deals-pipeline/leads');
    return response.data;
  },
  
  async updateLead(id: string, data: LeadUpdate) {
    return apiClient.put(`/api/deals-pipeline/leads/${id}`, data);
  }
};
```

**React Components:**
```typescript
// sdk/features/pipeline/components/LeadCard.tsx
import { usePipeline } from '../hooks';

export const LeadCard = ({ lead }) => {
  const { updateLead } = usePipeline();
  // Component logic
};
```

**State Management:**
```typescript
// sdk/features/pipeline/store/slices/pipelineSlice.ts
import { createSlice } from '@reduxjs/toolkit';

export const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    // Add new actions
  }
});
```

#### Step 5: Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test in browser
open http://localhost:3000/pipeline

# Run tests
npm test sdk/features/pipeline
```

#### Step 6: Commit Changes

```bash
# Stage changes
git add sdk/features/pipeline/

# Follow conventional commits
git commit -m "feat(pipeline): add lead filtering by status

- Add filter dropdown component
- Implement status filter in Redux
- Update API service with filter params
- Add unit tests for filter logic"
```

#### Step 7: Push to Feature Branch

```bash
# Push to YOUR feature branch (NOT develop)
git push origin feature/pipeline-ui-enhancements
```

#### Step 8: Create Pull Request

1. Go to GitHub: https://github.com/techiemaya-admin/LAD-Frontend
2. Click **"New Pull Request"**
3. Base: `develop` ← Compare: `feature/pipeline-ui-enhancements`
4. Fill in PR template:

```markdown
## Description
Add lead filtering functionality to pipeline view

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added status filter dropdown in PipelineBoard
- Implemented filter logic in pipelineSlice
- Updated API service with query params
- Added 15 unit tests

## Testing
- [x] Tested locally on http://localhost:3000/pipeline
- [x] All tests pass: `npm test`
- [x] Manually tested all filter options
- [x] Tested with backend API at http://localhost:3004

## Screenshots
[Attach before/after screenshots]

## Related Issues
Closes #123
```

5. Request reviews from team members
6. Wait for CI/CD checks to pass
7. Address review comments
8. After approval, merge to `develop`

---

### Frontend-Backend Sync

#### Ensure Backend is Running

Frontend developers need the backend API running:

```bash
# Option 1: Use production backend
# Update .env.local
NEXT_PUBLIC_API_URL=https://lad-backend-3nddlneyya-uc.a.run.app

# Option 2: Run backend locally
cd /path/to/LAD/backend
npm run dev
# Backend runs on http://localhost:3004

# Update .env.local
NEXT_PUBLIC_API_URL=http://localhost:3004
```

#### API Contracts

Frontend must follow backend API contracts:

```typescript
// Check contracts in feature repo
// lad-feature-deals-pipeline/contracts/api.md

// Example: GET /api/deals-pipeline/leads
interface Lead {
  id: string;
  company_name: string;
  status: 'new' | 'contacted' | 'qualified';
  // ... other fields
}
```

#### Testing Against Backend

```bash
# Test backend endpoints first
curl http://localhost:3004/api/deals-pipeline/health
curl http://localhost:3004/api/deals-pipeline/leads

# Then test frontend integration
npm run dev
# Open http://localhost:3000/pipeline
```

---

### Common Frontend Tasks

#### Task 1: Add New Filter Option

```typescript
// 1. Update types
// sdk/features/pipeline/types.ts
export interface FilterState {
  status?: string;
  priority?: 'high' | 'medium' | 'low'; // NEW
}

// 2. Update Redux slice
// sdk/features/pipeline/store/slices/pipelineSlice.ts
reducers: {
  setPriorityFilter(state, action) {
    state.filters.priority = action.payload;
  }
}

// 3. Update API service
// sdk/features/pipeline/services/api.ts
async getLeads(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.priority) params.set('priority', filters.priority);
  return apiClient.get(`/api/deals-pipeline/leads?${params}`);
}

// 4. Add UI component
// sdk/features/pipeline/components/PriorityFilter.tsx
export const PriorityFilter = () => {
  const dispatch = useDispatch();
  return (
    <select onChange={(e) => dispatch(setPriorityFilter(e.target.value))}>
      <option value="">All Priorities</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );
};
```

#### Task 2: Add New Page/Route

```bash
# Create new route
mkdir -p web/src/app/pipeline/analytics
touch web/src/app/pipeline/analytics/page.tsx
```

```typescript
// web/src/app/pipeline/analytics/page.tsx
'use client';
import { PipelineAnalytics } from '@/components/pipeline/PipelineAnalytics';

export default function AnalyticsPage() {
  return <PipelineAnalytics />;
}
```

#### Task 3: Add New Component

```typescript
// sdk/features/pipeline/components/LeadMetrics.tsx
import { usePipeline } from '../hooks';

export const LeadMetrics = () => {
  const { leads, loading } = usePipeline();
  
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  
  return (
    <div className="metrics">
      <div>Total: {totalLeads}</div>
      <div>Qualified: {qualifiedLeads}</div>
    </div>
  );
};
```

---

### LAD Rules for Frontend

1. **✅ Feature Branches Required**
   - Branch name: `feature/pipeline-*` or `feature/deals-*`
   - Never push to `develop` directly

2. **✅ Pull Request Workflow**
   - All changes via PR
   - At least 1 approval required
   - CI/CD must pass

3. **✅ Code Organization**
   - SDK code: `sdk/features/pipeline/`
   - Pages: `web/src/app/pipeline/`
   - Components: `web/src/components/pipeline/`

4. **✅ TypeScript Required**
   - All files must be `.ts` or `.tsx`
   - Strict type checking enabled
   - No `any` types without justification

5. **✅ Testing Required**
   - Unit tests for services/utils
   - Component tests for UI
   - Integration tests for API calls

6. **✅ No Direct API Calls in Components**
   - Use SDK services layer
   - Use Redux for state management
   - Use hooks for data access

---

### Debugging Frontend Issues

#### Issue: API calls fail with CORS error

```bash
# Check backend CORS settings
# Backend should allow frontend origin

# backend/server.js or backend/core/app.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lad-frontend-develop-*.a.run.app'
  ]
}));
```

#### Issue: State not updating

```typescript
// Check Redux DevTools
// Ensure actions are dispatched
// Verify reducer logic

// Add logging
console.log('Before update:', state);
dispatch(updateLead(data));
console.log('After update:', state);
```

#### Issue: Type errors

```bash
# Regenerate types from backend
# Check contracts/api.md in feature repo
# Update sdk/features/pipeline/types.ts to match
```

---

### Frontend PR Checklist

Before creating PR:

- [ ] Feature branch created from `develop`
- [ ] All changes in `sdk/features/pipeline/` or related folders
- [ ] TypeScript compilation passes: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Tested locally with backend API
- [ ] No console errors in browser
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] Accessibility checked (keyboard nav, screen readers)
- [ ] Code reviewed by yourself first
- [ ] Commit messages follow conventional commits
- [ ] PR description filled out completely
- [ ] Screenshots added if UI changes
- [ ] Documentation updated if needed

---

## 📞 Support

**Issues?**
- Feature Repo: https://github.com/techiemaya-admin/lad-feature-deals-pipeline/issues
- Main LAD Repo: (add issues URL)

**Documentation:**
- [INDEX.md](INDEX.md) - Overview
- [SETUP.md](SETUP.md) - Local setup
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - API reference
