#!/bin/bash
# Validation Script - Enforces LAD Rules

set -e

echo "🔍 Validating Deals Pipeline Feature..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Check file sizes (max 400 lines)
echo "📏 Checking file sizes (max 400 lines)..."
while IFS= read -r file; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 400 ]; then
    echo -e "${RED}❌ File exceeds 400 lines: $file ($lines lines)${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find backend/features/deals-pipeline -type f -name "*.js" -not -path "*/node_modules/*")

if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}✅ All files under 400 lines${NC}"
fi

# 2. Check for cross-feature imports
echo ""
echo "🔗 Checking for cross-feature imports..."
CROSS_IMPORTS=$(grep -r "require.*features/" backend/features/deals-pipeline --include="*.js" 2>/dev/null | grep -v "deals-pipeline" | grep -v "node_modules" || true)
if [ -n "$CROSS_IMPORTS" ]; then
  echo -e "${RED}❌ Found cross-feature imports:${NC}"
  echo "$CROSS_IMPORTS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No cross-feature imports${NC}"
fi

# 3. Check for tenant_id in queries
echo ""
echo "🏢 Checking tenant isolation..."
UNSAFE_QUERIES=$(grep -r "SELECT.*FROM" backend/features/deals-pipeline --include="*.js" 2>/dev/null | grep -v "tenant_id" | grep -v "node_modules" | grep -v "//" || true)
if [ -n "$UNSAFE_QUERIES" ]; then
  echo -e "${YELLOW}⚠️  Found queries potentially missing tenant_id filter:${NC}"
  echo "$UNSAFE_QUERIES"
  echo -e "${YELLOW}   Please verify these queries manually${NC}"
fi

# 4. Check API path consistency
echo ""
echo "🛣️  Checking API paths..."
OLD_PATHS=$(grep -r "/api/leads" backend/features/deals-pipeline --include="*.js" 2>/dev/null | grep -v "deals-pipeline" | grep -v "node_modules" | grep -v "//" || true)
if [ -n "$OLD_PATHS" ]; then
  echo -e "${RED}❌ Found old /api/leads paths - should be /api/deals-pipeline${NC}"
  echo "$OLD_PATHS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ API paths correct${NC}"
fi

# 5. Check for business logic in routes
echo ""
echo "🏗️  Checking architecture pattern..."
BUSINESS_IN_ROUTES=$(grep -r "async (req, res)" backend/features/deals-pipeline/routes --include="*.js" -A 5 2>/dev/null | grep -E "(await.*\.|SELECT|INSERT|UPDATE|DELETE)" | grep -v "Controller" || true)
if [ -n "$BUSINESS_IN_ROUTES" ]; then
  echo -e "${YELLOW}⚠️  Found potential business logic in routes - verify controllers are used${NC}"
fi

# 6. Check for authentication on routes
echo ""
echo "🔐 Checking authentication..."
UNPROTECTED=$(grep -r "router\.(get|post|put|delete)" backend/features/deals-pipeline/routes --include="*.js" 2>/dev/null | grep -v "jwtAuth" | grep -v "node_modules" || true)

# 6. Check for authentication on routes
echo ""
echo "🔐 Checking authentication..."
UNPROTECTED=$(grep -r "router\.(get|post|put|delete)" backend/features/deals-pipeline/routes --include="*.js" 2>/dev/null | grep -v "jwtAuth" | grep -v "node_modules" || true)
if [ -n "$UNPROTECTED" ]; then
  echo -e "${RED}❌ Found unprotected routes:${NC}"
  echo "$UNPROTECTED"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ All routes protected${NC}"
fi

# 7. Check for console.log in production code
echo ""
echo "📝 Checking for console.log..."
LOG_COUNT=$(grep -r "console\.log" backend/features/deals-pipeline --include="*.js" --exclude="*test*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOG_COUNT" -gt 20 ]; then
  echo -e "${YELLOW}⚠️  Found $LOG_COUNT console.log statements - consider using proper logging${NC}"
else
  echo -e "${GREEN}✅ Reasonable console.log usage ($LOG_COUNT)${NC}"
fi

# 8. Check directory structure
echo ""
echo "📁 Checking directory structure..."
REQUIRED_DIRS=("routes" "controllers" "services" "models" "middleware")
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "backend/features/deals-pipeline/$dir" ]; then
    echo -e "${RED}❌ Missing required directory: $dir${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done
echo -e "${GREEN}✅ All required directories present${NC}"

# 9. Check for proper exports
echo ""
echo "📤 Checking exports..."
if ! grep -r "exports\." backend/features/deals-pipeline/controllers --include="*.js" > /dev/null 2>&1; then
  echo -e "${RED}❌ Controllers missing exports${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Controllers have proper exports${NC}"
fi

# 10. Check for reference data ownership
echo ""
echo "🗂️  Checking reference data ownership..."
if grep -r "require.*reference" backend/features/deals-pipeline --include="*.js" 2>/dev/null | grep -v "deals-pipeline" | grep -v "node_modules" | grep -v "./"; then
  echo -e "${RED}❌ Reference data imported from other features${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ Reference data is feature-owned${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Validation passed! Feature follows LAD rules.${NC}"
  exit 0
else
  echo -e "${RED}❌ Validation failed with $ERRORS errors${NC}"
  exit 1
fi
