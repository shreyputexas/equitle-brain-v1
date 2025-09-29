# Google Workspace Integration Testing Guide

## 🧪 How to Test the Integration

### Phase 1: Basic Server Testing (No Google Credentials Required)

#### 1. Start the Server
```bash
cd server
npm run dev:server
```

The server should start on port 4001 with output like:
```
✅ Firebase Admin SDK initialized successfully
✅ Firestore connected successfully
✅ Firebase Auth connected successfully
🚀 Server running on port 4001
```

#### 2. Test Basic Endpoints

**Health Check:**
```bash
curl http://localhost:4001/health
```
Expected: `{"status":"OK","timestamp":"..."}`

**Google Setup Check:**
```bash
curl -H "Authorization: Bearer mock-token" \
     http://localhost:4001/api/integrations/test
```
Expected: Message about missing environment variables (this is correct!)

**User Integrations:**
```bash
curl -H "Authorization: Bearer mock-token" \
     http://localhost:4001/api/integrations
```
Expected: Empty integrations list `{"success":true,"data":[]}`

### Phase 2: Google Credentials Setup

#### 1. Get Google OAuth Credentials

Follow these steps in `GOOGLE_WORKSPACE_SETUP.md`:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Gmail API, Google Drive API, Google Calendar API
4. Create OAuth 2.0 Client ID
5. Add redirect URI: `http://localhost:4001/api/integrations/google/callback`

#### 2. Update Environment Variables

Edit `.env.local` (or create it):
```env
GOOGLE_API_KEY=AIzaSyCinFvuMO4CgwxoJFZYZjBZcNRD66kxMB8
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:4001/api/integrations/google/callback
FIREBASE_PROJECT_ID=equitle-brain-dev
NODE_ENV=development
PORT=4001
FRONTEND_URL=http://localhost:3000
```

#### 3. Restart Server and Test Setup

```bash
# Restart server to load new environment variables
npm run dev:server
```

```bash
# Test Google setup (should now show credentials are configured)
curl -H "Authorization: Bearer mock-token" \
     http://localhost:4001/api/integrations/test
```

Expected:
```json
{
  "success": true,
  "data": {
    "googleSetup": {
      "hasClientId": true,
      "hasClientSecret": true,
      "hasRedirectUri": true,
      "isConfigured": true
    },
    "testAuthUrl": "https://accounts.google.com/oauth/authorize?...",
    "message": "Google integration is properly configured"
  }
}
```

### Phase 3: OAuth Flow Testing

#### 1. Initiate OAuth Connection

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"types": ["gmail", "drive", "profile"]}' \
  http://localhost:4001/api/integrations/google/connect
```

Expected response with `authUrl`:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/oauth/authorize?...",
    "scopes": ["..."],
    "types": ["gmail", "drive", "profile"]
  }
}
```

#### 2. Complete OAuth Flow

1. **Copy the `authUrl`** from the response above
2. **Paste it in your browser** and authorize with your Google account
3. **You'll be redirected** to `http://localhost:3000/settings?integration=success&...`

#### 3. Verify Integration Created

```bash
curl -H "Authorization: Bearer mock-token" \
     http://localhost:4001/api/integrations
```

Expected: List of your connected integrations:
```json
{
  "success": true,
  "data": [
    {
      "id": "integration-id",
      "provider": "google",
      "type": "gmail",
      "isActive": true,
      "profile": {
        "email": "your-email@gmail.com",
        "name": "Your Name"
      },
      "scope": ["..."],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Phase 4: Data Access Testing

#### 1. Test Gmail Access

```bash
curl -H "Authorization: Bearer mock-token" \
     "http://localhost:4001/api/integrations/google/gmail/messages?maxResults=5"
```

Expected: Your recent Gmail messages

#### 2. Test Google Drive Access

```bash
curl -H "Authorization: Bearer mock-token" \
     "http://localhost:4001/api/integrations/google/drive/files"
```

Expected: Your Google Drive files

### Phase 5: LLM Data Processing Testing

#### 1. Test Normalized Email Data

```bash
curl -H "Authorization: Bearer mock-token" \
     "http://localhost:4001/api/google-workspace/emails/normalized?maxResults=5&includeBody=false"
```

Expected: Structured email data perfect for LLM processing

#### 2. Test CRM-Relevant Emails

```bash
curl -H "Authorization: Bearer mock-token" \
     "http://localhost:4001/api/google-workspace/emails/crm-relevant?maxResults=10"
```

Expected: Only business/CRM relevant emails

#### 3. Test Contact Extraction

```bash
curl -H "Authorization: Bearer mock-token" \
     "http://localhost:4001/api/google-workspace/contacts/extracted?maxEmails=50"
```

Expected: Extracted contacts from your emails with interaction data

#### 4. Test Deal-Related Emails

```bash
curl -H "Authorization: Bearer mock-token" \
     "http://localhost:4001/api/google-workspace/emails/deals"
```

Expected: Investment/deal related emails

### Phase 6: Integration Health Check

```bash
curl -H "Authorization: Bearer mock-token" \
     http://localhost:4001/api/google-workspace/health
```

Expected:
```json
{
  "success": true,
  "data": {
    "userId": "dev-user-123",
    "integrations": {
      "gmail": true,
      "drive": true,
      "calendar": false,
      "profile": true
    },
    "totalActiveIntegrations": 3,
    "lastChecked": "2023-12-01T10:00:00.000Z"
  }
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **"User not authenticated"**
   - Make sure you include `Authorization: Bearer mock-token` header

2. **"Integration not found"**
   - Complete the OAuth flow first by visiting the `authUrl`

3. **"Failed to fetch integrations"**
   - Check server logs for Firebase connection issues
   - Ensure Firebase project is configured

4. **"Invalid token" or OAuth errors**
   - Verify Google Cloud Console setup
   - Check redirect URI matches exactly
   - Ensure APIs are enabled

5. **CORS errors (in browser)**
   - Check `FRONTEND_URL` environment variable
   - Make sure it matches your frontend URL

### Viewing Server Logs:

```bash
# View live logs
npm run dev:server

# Or check Firebase connection
curl http://localhost:4001/health
```

## ✅ Success Criteria

Your integration is working correctly when:

1. ✅ Server starts without errors
2. ✅ Google setup test shows all credentials configured
3. ✅ OAuth flow completes successfully
4. ✅ User integrations list shows connected accounts
5. ✅ Gmail/Drive APIs return real user data
6. ✅ Normalized data endpoints return structured results
7. ✅ Health check shows active integrations

## 🚀 Next Steps

Once testing is complete:

1. **Build Frontend UI** - Create user interface for OAuth management
2. **Add Webhooks** - Real-time sync with Google services
3. **Enhance Data Processing** - Add more sophisticated NLP for contact/deal extraction
4. **Production Deployment** - Update redirect URIs for production domain