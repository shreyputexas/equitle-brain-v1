#!/bin/bash

# Get auth token from localStorage (you'll need to paste it here)
# To get your token:
# 1. Open browser console (F12)
# 2. Type: localStorage.getItem('token')
# 3. Copy the token and paste it below

TOKEN="${1:-YOUR_TOKEN_HERE}"

if [ "$TOKEN" = "YOUR_TOKEN_HERE" ]; then
  echo "❌ Please provide your auth token as an argument"
  echo ""
  echo "Usage: ./cleanup-emails.sh YOUR_TOKEN"
  echo ""
  echo "To get your token:"
  echo "1. Open your app in browser (F12)"
  echo "2. Console tab → type: localStorage.getItem('token')"
  echo "3. Copy the token"
  echo "4. Run: ./cleanup-emails.sh <paste-token-here>"
  exit 1
fi

echo "🗑️  Deleting ALL emails from Firebase..."
echo ""

RESPONSE=$(curl -s -X DELETE http://localhost:4001/api/firebase-emails/all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | grep -q "success.*true" && echo "✅ SUCCESS!" || echo "❌ FAILED"
echo ""
echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo "Now refresh your browser to see only Microsoft emails!"

