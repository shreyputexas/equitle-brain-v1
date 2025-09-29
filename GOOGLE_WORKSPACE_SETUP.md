# Google Workspace Integration Setup Guide

## Overview

This guide will help you set up the Google Workspace integration so users can connect their Gmail and Google Drive accounts securely.

## Prerequisites

- Your Google API Key: `AIzaSyCinFvuMO4CgwxoJFZYZjBZcNRD66kxMB8`
- Access to Google Cloud Console
- Running Firebase project

## Step 1: Create Google OAuth2 Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Enable these APIs:
     - Gmail API
     - Google Drive API
     - Google Calendar API
     - Google People API (for profiles)

3. **Create OAuth2 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Equitle Brain Google Integration"
   - Authorized redirect URIs:
     - `http://localhost:4001/api/integrations/google/callback` (development)
     - `https://yourdomain.com/api/integrations/google/callback` (production)

4. **Download Credentials**
   - Save the Client ID and Client Secret

## Step 2: Update Environment Variables

Update your `.env.local` file with the Google credentials:

```env
# Google Workspace API Configuration
GOOGLE_API_KEY=AIzaSyCinFvuMO4CgwxoJFZYZjBZcNRD66kxMB8
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:4001/api/integrations/google/callback

# Firebase Configuration (keep existing values)
FIREBASE_PROJECT_ID=equitle-brain-dev
NODE_ENV=development

# Server Configuration
PORT=4001
FRONTEND_URL=http://localhost:3000
```

## Step 3: Start the Server

```bash
npm run dev:server
```

The server should start on port 4001.

## Step 4: Test the Integration

### Check Integration Health
```bash
curl -H "Authorization: Bearer mock-token" http://localhost:4001/api/integrations/test
```

### Initiate OAuth Flow
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"types": ["gmail", "drive", "profile"]}' \
  http://localhost:4001/api/integrations/google/connect
```

This will return an `authUrl` that users can visit to authorize the application.

## API Endpoints

### Integration Management
- `GET /api/integrations` - Get user's integrations
- `POST /api/integrations/google/connect` - Start OAuth flow
- `GET /api/integrations/google/callback` - OAuth callback (automatic)
- `DELETE /api/integrations/:id` - Disconnect integration

### Gmail & Drive Access
- `GET /api/integrations/google/gmail/messages` - Get Gmail messages
- `GET /api/integrations/google/gmail/labels` - Get Gmail labels
- `POST /api/integrations/google/gmail/send` - Send email
- `GET /api/integrations/google/drive/files` - Get Drive files

### Normalized Data for LLM
- `GET /api/google-workspace/emails/normalized` - Get normalized email data
- `GET /api/google-workspace/emails/crm-relevant` - Get CRM-relevant emails
- `GET /api/google-workspace/emails/deals` - Get deal-related emails
- `GET /api/google-workspace/contacts/extracted` - Extract contacts from emails
- `GET /api/google-workspace/drive/files` - Get Drive files with metadata
- `GET /api/google-workspace/health` - Check integration status

## Data Structure

### Normalized Email Format
```json
{
  "id": "email-id",
  "threadId": "thread-id",
  "subject": "Email Subject",
  "from": { "name": "John Doe", "email": "john@example.com" },
  "to": [{ "name": "Jane Smith", "email": "jane@example.com" }],
  "date": "2023-12-01T10:00:00Z",
  "body": { "text": "Email content...", "html": "..." },
  "attachments": [...],
  "labels": ["INBOX", "IMPORTANT"],
  "importance": "high",
  "keywords": ["meeting", "proposal"],
  "entities": {
    "people": [...],
    "companies": [...],
    "dates": [...],
    "amounts": [...]
  },
  "crmRelevant": true,
  "dealRelated": true,
  "metadata": {
    "source": "gmail",
    "userId": "user-id",
    "processedAt": "2023-12-01T10:05:00Z",
    "version": "1.0.0"
  }
}
```

### Extracted Contact Format
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Example Corp",
  "lastInteraction": "2023-12-01T10:00:00Z",
  "interactionCount": 5,
  "interactionTypes": ["email", "meeting"],
  "sentiment": "positive",
  "importance": "high",
  "dealPotential": "medium",
  "tags": [],
  "metadata": {
    "sources": ["gmail"],
    "userId": "user-id",
    "processedAt": "2023-12-01T10:05:00Z"
  }
}
```

## Security Features

1. **Per-User Authentication**: Each user connects their own Google account
2. **Token Refresh**: Automatic refresh of expired access tokens
3. **Secure Storage**: OAuth tokens stored in Firestore per user
4. **Rate Limiting**: Built-in rate limiting and CORS protection
5. **Scope Management**: Granular permissions for different Google services

## Frontend Integration

To integrate with your frontend, create a simple OAuth flow:

```javascript
// 1. Start OAuth flow
const response = await fetch('/api/integrations/google/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    types: ['gmail', 'drive', 'profile']
  })
});

const { authUrl } = await response.json();

// 2. Redirect user to authUrl
window.location.href = authUrl;

// 3. User authorizes and is redirected back to your app
// 4. Check integration status
const integrations = await fetch('/api/integrations', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
```

## Troubleshooting

1. **"Integration not found" errors**: User needs to complete OAuth flow first
2. **Token expired errors**: Should auto-refresh, check logs
3. **Permission errors**: Verify OAuth scopes in Google Cloud Console
4. **CORS errors**: Check FRONTEND_URL environment variable

## Next Steps

1. Complete the OAuth setup in Google Cloud Console
2. Update environment variables with real credentials
3. Test the integration flow
4. Build frontend UI for OAuth management
5. Add webhook handlers for real-time data sync