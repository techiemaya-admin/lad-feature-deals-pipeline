#!/bin/bash
# Test Frontend SDK with curl examples

BASE_URL="http://localhost:3004/api/deals-pipeline"

echo "🧪 Testing Deals Pipeline Frontend SDK"
echo "======================================"
echo ""

# Check if server is running
echo "1️⃣  Checking server health..."
HEALTH=$(curl -s -w "\n%{http_code}" ${BASE_URL%/api/deals-pipeline}/health)
HTTP_CODE=$(echo "$HEALTH" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Server is running on http://localhost:3004"
else
    echo "❌ Server not running. Start it with: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣  Testing GET /api/deals-pipeline/pipeline/board"
curl -s "$BASE_URL/pipeline/board" | python3 -m json.tool || echo "Response received"

echo ""
echo ""
echo "3️⃣  Testing GET /api/deals-pipeline/stages"
curl -s "$BASE_URL/stages" | python3 -m json.tool || echo "Response received"

echo ""
echo ""
echo "4️⃣  Testing GET /api/deals-pipeline/reference/statuses"
curl -s "$BASE_URL/reference/statuses" | python3 -m json.tool || echo "Response received"

echo ""
echo ""
echo "5️⃣  Example: Create lead (would require auth)"
echo "curl -X POST $BASE_URL/leads \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -d '{"
echo "    \"name\": \"John Doe\","
echo "    \"email\": \"john@example.com\","
echo "    \"company\": \"Acme Corp\","
echo "    \"value\": 50000"
echo "  }'"

echo ""
echo ""
echo "✅ All tests completed!"
echo ""
echo "📚 Next steps for frontend developers:"
echo "1. Read: FRONTEND_GUIDE.md"
echo "2. Check: frontend/sdk/features/deals-pipeline/README.md"
echo "3. Example: ui/pipeline/Board.tsx"
