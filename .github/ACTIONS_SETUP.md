# GitHub Actions Setup Guide

## 🎯 Overview

This guide helps you set up automated synchronization from the feature repository to the main LAD repository using GitHub Actions.

---

## 📋 Prerequisites

1. GitHub repository for feature: `techiemaya-admin/lad-feature-deals-pipeline`
2. GitHub repository for main LAD (update in workflow file)
3. GitHub Personal Access Token with `repo` access

---

## 🔧 Setup Steps

### Step 1: Create Personal Access Token

1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Settings:
   - **Note:** `LAD Repo Access for Feature Sync`
   - **Expiration:** 90 days (or longer)
   - **Scopes:**
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again!)

### Step 2: Add Token to Feature Repo Secrets

1. Go to feature repo: https://github.com/techiemaya-admin/lad-feature-deals-pipeline
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret:
   - **Name:** `LAD_REPO_TOKEN`
   - **Value:** [paste the token from Step 1]
5. Click **Add secret**

### Step 3: (Optional) Add Slack Webhook for Notifications

1. Go to your Slack workspace
2. Create an Incoming Webhook: https://api.slack.com/messaging/webhooks
3. Copy the webhook URL
4. In GitHub repo secrets, add:
   - **Name:** `SLACK_WEBHOOK_URL`
   - **Value:** [paste webhook URL]

### Step 4: Update Workflow File

Edit `.github/workflows/sync-to-main.yml`:

```yaml
# Line 40: Update with your main LAD repo
repository: techiemaya-admin/LAD  # Change this!

# Line 43: Update target branch if different
ref: ${{ github.event.inputs.target_branch || 'develop' }}
```

### Step 5: Commit and Push Workflow

```bash
cd /Users/naveenreddy/Desktop/AI-Maya/lad-feature-deals-pipeline

git add .github/workflows/sync-to-main.yml
git commit -m "ci: add automated sync workflow to main LAD repo"
git push origin main
```

---

## 🚀 How to Use

### Automatic Sync (on every push to main)

Simply push to main branch:

```bash
git push origin main
```

The workflow will automatically:
1. ✅ Run tests
2. ✅ Validate LAD compliance
3. ✅ Create sync branch in main repo
4. ✅ Copy all feature files
5. ✅ Create Pull Request
6. ✅ Notify team (if Slack configured)

### Manual Sync

1. Go to Actions tab in GitHub
2. Click "Sync to Main LAD Repo" workflow
3. Click "Run workflow"
4. Select target branch (default: develop)
5. Click "Run workflow"

---

## 📊 Workflow Overview

### Jobs

1. **validate**
   - Runs tests (`npm test`)
   - Validates LAD compliance
   - Checks file size limits (<400 lines)

2. **create-sync-pr**
   - Clones both repositories
   - Creates sync branch in main repo
   - Copies feature files
   - Commits changes
   - Creates Pull Request

3. **notify**
   - Sends Slack notification on success/failure

### Files Synced

- ✅ `backend/features/deals-pipeline/` → `main-repo/backend/features/deals-pipeline/`
- ✅ `frontend/sdk/features/deals-pipeline/` → `main-repo/frontend/sdk/features/deals-pipeline/`
- ✅ `contracts/*` → `main-repo/contracts/deals-pipeline/`

---

## 🔍 Monitoring

### Check Workflow Status

1. Go to feature repo Actions tab
2. View latest workflow run
3. Check each job status

### View Logs

Click on any job to see detailed logs:
- Test output
- Validation results
- Files copied
- PR creation status

### Pull Request in Main Repo

1. Go to main LAD repo
2. Check Pull Requests tab
3. Look for "[Auto-Sync] Deals Pipeline Feature Update"

---

## 🔐 Security Notes

### Token Permissions

The `LAD_REPO_TOKEN` needs:
- ✅ Read/write access to main LAD repo
- ✅ Ability to create branches
- ✅ Ability to create pull requests

### Best Practices

1. **Token Expiration:** Set reasonable expiration (90 days)
2. **Token Rotation:** Rotate token regularly
3. **Minimal Scope:** Only grant required permissions
4. **Secret Management:** Never commit tokens to code

### Revoking Access

If token is compromised:
1. Go to https://github.com/settings/tokens
2. Find the token
3. Click "Delete"
4. Create new token and update secret

---

## 🧪 Testing the Workflow

### Test in Feature Repo First

1. Make a small change in feature repo:
```bash
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger workflow"
git push origin main
```

2. Go to Actions tab
3. Watch workflow run
4. Verify PR created in main repo

### Dry Run (Without Creating PR)

Modify workflow to skip PR creation:

```yaml
# Comment out the "Create Pull Request" step
# - name: Create Pull Request
#   uses: peter-evans/create-pull-request@v5
```

---

## 🚨 Troubleshooting

### Workflow Fails: "Resource not accessible by integration"

**Problem:** Token doesn't have sufficient permissions  
**Solution:** Recreate token with `repo` and `workflow` scopes

### Workflow Fails: "Ref develop not found"

**Problem:** Target branch doesn't exist in main repo  
**Solution:** Create develop branch first:
```bash
cd /path/to/LAD
git checkout -b develop
git push origin develop
```

### PR Not Created

**Problem:** Token expired or invalid  
**Solution:** 
1. Check token validity: https://github.com/settings/tokens
2. Update secret if needed

### Tests Fail in Workflow

**Problem:** Dependencies not installed or test failures  
**Solution:**
1. Run tests locally first: `npm test`
2. Fix any failing tests
3. Push changes

### Files Not Synced

**Problem:** Paths are incorrect in workflow  
**Solution:** Verify paths in `.github/workflows/sync-to-main.yml`

---

## 📚 Additional Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Create Pull Request Action:** https://github.com/peter-evans/create-pull-request
- **Slack Webhooks:** https://api.slack.com/messaging/webhooks
- **Feature Repo:** https://github.com/techiemaya-admin/lad-feature-deals-pipeline

---

## 🔄 Manual Fallback

If automated workflow fails, use manual merge:

```bash
# Use the merge script
./scripts/merge-to-main.sh /path/to/LAD

# Or follow the full guide
open MERGE_PIPELINE.md
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `LAD_REPO_TOKEN` secret added to feature repo
- [ ] Main LAD repo URL updated in workflow file
- [ ] Workflow file committed and pushed
- [ ] Test push triggers workflow
- [ ] Workflow completes successfully
- [ ] PR created in main repo
- [ ] All files synced correctly
- [ ] Slack notification received (if configured)

---

**Questions?** Check [MERGE_PIPELINE.md](MERGE_PIPELINE.md) for detailed merge instructions.
