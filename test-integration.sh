#!/bin/bash

echo "🧪 Testing Google Workspace Integration"
echo "======================================"

BASE_URL="http://localhost:4001"
AUTH_HEADER="Authorization: Bearer mock-token"

echo ""
echo "1. Testing server health..."
curl -s "$BASE_URL/health" | jq '.' || echo "Health check failed"

echo ""
echo "2. Testing Google integration setup..."
curl -s -H "$AUTH_HEADER" "$BASE_URL/api/integrations/test" | jq '.' || echo "Integration test failed"

echo ""
echo "3. Testing current user integrations..."
curl -s -H "$AUTH_HEADER" "$BASE_URL/api/integrations" | jq '.' || echo "User integrations test failed"

echo ""
echo "4. Testing OAuth initiation (should return authUrl)..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{"types": ["gmail", "drive", "profile"]}' \
  "$BASE_URL/api/integrations/google/connect" | jq '.' || echo "OAuth initiation failed"

echo ""
echo "5. Testing Google Workspace health..."
curl -s -H "$AUTH_HEADER" "$BASE_URL/api/google-workspace/health" | jq '.' || echo "Google Workspace health failed"

echo ""
echo "✅ Basic tests complete!"
echo ""
echo "📋 Next steps:"
echo "1. If tests pass, you need real Google OAuth credentials"
echo "2. Follow GOOGLE_WORKSPACE_SETUP.md to get credentials"
echo "3. Update .env.local with real credentials"
echo "4. Complete OAuth flow by visiting the authUrl"