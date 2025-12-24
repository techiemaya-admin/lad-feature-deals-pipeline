# Quick Merge Reference

## 🎯 Choose Your Method

### 1️⃣ Manual (First Time) - 5 minutes
```bash
./scripts/merge-to-main.sh /path/to/LAD
```
**Best for:** First-time merge, full control

### 2️⃣ Automated (GitHub Actions) - Setup once
```bash
# Setup: Follow .github/ACTIONS_SETUP.md (one time)
# Then just push:
git push origin main
```
**Best for:** Continuous integration, hands-off

### 3️⃣ Git Subtree (Advanced) - Ongoing syncs
```bash
cd /path/to/LAD
git subtree pull --prefix=backend/features/deals-pipeline \
  feature-deals main --squash
```
**Best for:** Bidirectional syncs, version control experts

---

## 📦 What Gets Merged

```
Feature Repo                    →  Main LAD Repo
────────────────────────────────────────────────
backend/features/deals-pipeline  →  backend/features/deals-pipeline/
frontend/sdk/features/...        →  frontend/sdk/features/deals-pipeline/
contracts/*                      →  contracts/deals-pipeline/
```

---

## ✅ Integration Steps (After Merge)

```javascript
// 1. backend/core/app.js
const dealsPipelineRouter = require('./features/deals-pipeline/routes');
app.use('/api/deals-pipeline', dealsPipelineRouter);

// 2. backend/core/feature_registry.js
'deals-pipeline': {
  name: 'Deals Pipeline',
  version: '2.0.0',
  routes: '/api/deals-pipeline'
}

// 3. Install & test
npm install
npm test
npm run dev
```

---

## 🧪 Quick Test

```bash
# After merge and server start:
curl http://localhost:3004/api/deals-pipeline/health
# Expected: {"status":"healthy","feature":"deals-pipeline"}
```

---

## 🎨 Frontend Development

### LAD Frontend Repo Structure

```
LAD-Frontend/
├── sdk/features/pipeline/     # ✅ Already exists - SDK for deals-pipeline
└── web/src/app/pipeline/      # ✅ Already exists - Pipeline page
```

### Frontend Feature Branch Workflow

**⚠️ NEVER push directly to `develop`**

```bash
# Clone frontend repo
git clone https://github.com/techiemaya-admin/LAD-Frontend.git
cd LAD-Frontend

# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/pipeline-ui-improvements

# Make changes in sdk/features/pipeline/
# Edit services, components, store, etc.

# Test locally
npm run dev  # http://localhost:3000/pipeline

# Push to feature branch (NOT develop)
git push origin feature/pipeline-ui-improvements

# Create PR: feature/pipeline-ui-improvements → develop
```

### What Frontend Developers Work On

- **SDK Services:** `sdk/features/pipeline/services/` - API calls to backend
- **Components:** `sdk/features/pipeline/components/` - Reusable UI
- **State:** `sdk/features/pipeline/store/` - Redux slices
- **Pages:** `web/src/app/pipeline/` - Next.js routes
- **Types:** `sdk/features/pipeline/types.ts` - TypeScript interfaces

### Backend Integration

```bash
# Option 1: Use production backend
NEXT_PUBLIC_API_URL=https://lad-backend-3nddlneyya-uc.a.run.app

# Option 2: Run backend locally
cd LAD/backend && npm run dev
NEXT_PUBLIC_API_URL=http://localhost:3004
```

---

## 📚 Full Documentation

- **Complete Guide:** [MERGE_PIPELINE.md](MERGE_PIPELINE.md)
- **GitHub Actions:** [.github/ACTIONS_SETUP.md](.github/ACTIONS_SETUP.md)
- **All Docs:** [INDEX.md](INDEX.md)
