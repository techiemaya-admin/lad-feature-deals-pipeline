#!/bin/bash
# Merge deals-pipeline feature to main LAD repo
# Usage: ./scripts/merge-to-main.sh /path/to/LAD

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
FEATURE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAD_MAIN_DIR="${1:-/Users/naveenreddy/Desktop/AI-Maya/LAD}"
BRANCH_NAME="feature/deals-pipeline-integration-$(date +%Y%m%d)"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Deals Pipeline Feature → Main LAD Repo Merge${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Feature Repo: $FEATURE_DIR"
echo "Main LAD Repo: $LAD_MAIN_DIR"
echo "Target Branch: $BRANCH_NAME"
echo ""

# Step 1: Validate feature repo
echo -e "${YELLOW}[1/8] Validating feature repository...${NC}"
cd "$FEATURE_DIR"

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Not in a valid feature repository${NC}"
  exit 1
fi

# Run validation
if [ -f "./scripts/validate.sh" ]; then
  echo "Running LAD compliance validation..."
  ./scripts/validate.sh || {
    echo -e "${RED}❌ LAD validation failed. Fix issues before merging.${NC}"
    exit 1
  }
fi

echo -e "${GREEN}✓ Feature repo validated${NC}"
echo ""

# Step 2: Check main repo
echo -e "${YELLOW}[2/8] Checking main LAD repository...${NC}"
if [ ! -d "$LAD_MAIN_DIR" ]; then
  echo -e "${RED}❌ Error: LAD main repo not found at $LAD_MAIN_DIR${NC}"
  echo "Usage: ./scripts/merge-to-main.sh /path/to/LAD"
  exit 1
fi

cd "$LAD_MAIN_DIR"

if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Error: $LAD_MAIN_DIR is not a git repository${NC}"
  echo "Initialize git first: cd $LAD_MAIN_DIR && git init"
  exit 1
fi

echo -e "${GREEN}✓ Main repo found${NC}"
echo ""

# Step 3: Create feature branch
echo -e "${YELLOW}[3/8] Creating feature branch in main repo...${NC}"
cd "$LAD_MAIN_DIR"

# Ensure on develop branch
git fetch origin develop 2>/dev/null || echo "Note: No remote 'origin' configured"
git checkout develop 2>/dev/null || git checkout -b develop

# Create feature branch
git checkout -b "$BRANCH_NAME" || {
  echo -e "${RED}❌ Branch already exists. Delete it first or use a different name.${NC}"
  exit 1
}

echo -e "${GREEN}✓ Created branch: $BRANCH_NAME${NC}"
echo ""

# Step 4: Copy backend feature
echo -e "${YELLOW}[4/8] Copying backend feature files...${NC}"
mkdir -p "$LAD_MAIN_DIR/backend/features"
cp -r "$FEATURE_DIR/backend/features/deals-pipeline" "$LAD_MAIN_DIR/backend/features/"
echo -e "${GREEN}✓ Copied backend/features/deals-pipeline${NC}"

# Copy shared utilities if needed
if [ -d "$FEATURE_DIR/backend/shared/database" ]; then
  mkdir -p "$LAD_MAIN_DIR/backend/shared"
  cp -r "$FEATURE_DIR/backend/shared/database" "$LAD_MAIN_DIR/backend/shared/"
  echo -e "${GREEN}✓ Copied backend/shared/database${NC}"
fi
echo ""

# Step 5: Copy frontend SDK
echo -e "${YELLOW}[5/8] Copying frontend SDK...${NC}"
if [ -d "$FEATURE_DIR/frontend/sdk/features/deals-pipeline" ]; then
  mkdir -p "$LAD_MAIN_DIR/frontend/sdk/features"
  cp -r "$FEATURE_DIR/frontend/sdk/features/deals-pipeline" "$LAD_MAIN_DIR/frontend/sdk/features/"
  echo -e "${GREEN}✓ Copied frontend/sdk/features/deals-pipeline${NC}"
fi
echo ""

# Step 6: Copy contracts
echo -e "${YELLOW}[6/8] Copying contracts...${NC}"
if [ -d "$FEATURE_DIR/contracts" ]; then
  mkdir -p "$LAD_MAIN_DIR/contracts/deals-pipeline"
  cp -r "$FEATURE_DIR/contracts/"* "$LAD_MAIN_DIR/contracts/deals-pipeline/"
  echo -e "${GREEN}✓ Copied contracts${NC}"
fi
echo ""

# Step 7: Stage changes
echo -e "${YELLOW}[7/8] Staging changes...${NC}"
cd "$LAD_MAIN_DIR"
git add backend/features/deals-pipeline
git add frontend/sdk/features/deals-pipeline 2>/dev/null || true
git add contracts/deals-pipeline 2>/dev/null || true
git add backend/shared/database 2>/dev/null || true

echo -e "${GREEN}✓ Changes staged${NC}"
echo ""

# Step 8: Create commit
echo -e "${YELLOW}[8/8] Creating commit...${NC}"
git commit -m "feat: integrate deals-pipeline feature

- Add deals pipeline feature with routes, controllers, services
- Add frontend SDK for deals-pipeline  
- Add database contracts and documentation
- Register feature in feature registry
- Version: 2.0.0

Source: https://github.com/techiemaya-admin/lad-feature-deals-pipeline"

echo -e "${GREEN}✓ Commit created${NC}"
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Merge preparation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Review the changes:"
echo -e "   ${YELLOW}cd $LAD_MAIN_DIR${NC}"
echo -e "   ${YELLOW}git diff develop${NC}"
echo ""
echo "2. Update integration points:"
echo "   - backend/core/app.js (mount router)"
echo "   - backend/core/feature_registry.js (register feature)"
echo "   - backend/package.json (merge dependencies)"
echo ""
echo "3. Test the integration:"
echo -e "   ${YELLOW}npm install${NC}"
echo -e "   ${YELLOW}npm test${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Push to remote:"
echo -e "   ${YELLOW}git push origin $BRANCH_NAME${NC}"
echo ""
echo "5. Create Pull Request:"
echo "   - From: $BRANCH_NAME"
echo "   - To: develop"
echo ""
echo -e "${YELLOW}📚 Full guide: $FEATURE_DIR/MERGE_PIPELINE.md${NC}"
echo ""
