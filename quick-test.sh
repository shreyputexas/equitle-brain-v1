#!/bin/bash

echo "🧪 Quick Google Workspace Integration Test"
echo "========================================"

BASE_URL="http://localhost:4001"
AUTH_HEADER="Authorization: Bearer mock-token"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"

    echo -n "Testing $name... "

    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -H "$AUTH_HEADER" -d "$data" "$url")
    else
        response=$(curl -s -H "$AUTH_HEADER" "$url")
    fi

    if echo "$response" | grep -q '"success":true\|"status":"OK"'; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Response: $response"
        return 1
    fi
}

echo ""
echo "1. Testing basic server health..."
test_endpoint "Server Health" "$BASE_URL/health"

echo ""
echo "2. Testing Google integration setup..."
test_endpoint "Google Setup" "$BASE_URL/api/integrations/test"

echo ""
echo "3. Testing user integrations..."
if test_endpoint "User Integrations" "$BASE_URL/api/integrations"; then
    echo "   (Empty list is expected if no OAuth completed yet)"
fi

echo ""
echo "4. Testing OAuth initiation..."
test_endpoint "OAuth Initiation" "$BASE_URL/api/integrations/google/connect" "POST" '{"types": ["gmail", "drive", "profile"]}'

echo ""
echo "5. Testing Google Workspace health..."
test_endpoint "Workspace Health" "$BASE_URL/api/google-workspace/health"

echo ""
echo "📋 Test Summary:"
echo "==============="
echo ""
echo "✅ If tests 1, 2, 4, 5 passed: Basic integration is working!"
echo "⚠️  If test 2 shows 'missing environment variables': You need Google OAuth credentials"
echo "⚠️  If test 3 shows empty data: Complete OAuth flow first"
echo ""
echo "🔧 Next Steps:"
echo "1. If Google setup test failed: Follow GOOGLE_WORKSPACE_SETUP.md"
echo "2. If tests passed: Complete OAuth by visiting the authUrl from test 4"
echo "3. After OAuth: Re-run tests to see real data"
echo ""
echo "📖 For detailed testing: See TESTING_GUIDE.md"