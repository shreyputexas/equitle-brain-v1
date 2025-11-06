# Required Environment Variables for Render Production

## Critical Variables (Must Be Set)

### Frontend Configuration
- `FRONTEND_URL=https://equitle.com` (or `https://www.equitle.com`)
  - Used for OAuth redirects after successful authentication
  - Currently defaults to localhost, causing production failures

### Apollo Integration
- `APOLLO_CLIENT_ID=<your-apollo-client-id>`
  - Required for Apollo OAuth flow
  - Currently has placeholder default that will cause errors
  
- `APOLLO_CLIENT_SECRET=<your-apollo-client-secret>`
  - Required for Apollo OAuth token exchange
  - Currently has placeholder default that will cause errors
  
- `APOLLO_REDIRECT_URI=https://api.equitle.com/api/integrations/apollo/callback`
  - Apollo OAuth callback URL
  - Currently defaults to localtunnel URL which won't work in production

### Backend URLs
- `BACKEND_URL=https://api.equitle.com`
  - Used for generating file URLs and WebSocket connections
  - Currently defaults to localhost

### Firebase Configuration
- `FIREBASE_USE_EMULATORS=false` (for production)
- `FIREBASE_SERVICE_ACCOUNT_JSON=<json-string>` OR `FIREBASE_SERVICE_ACCOUNT_PATH=<path>`
  - Required for Firebase Admin SDK in production
  - Either the JSON as a string or path to service account file

- `FIREBASE_PROJECT_ID=<your-project-id>`
- `FIREBASE_STORAGE_BUCKET=<your-bucket-name>`

### Other Required Variables
- `OPENAI_API_KEY=<your-openai-key>` (if using AI features)
- `PORT=10000` (or whatever Render assigns)
- `NODE_ENV=production`

## Optional but Recommended
- `BASE_URL=https://api.equitle.com`
- `LLM_WEBSOCKET_URL=wss://api.equitle.com/llm`

## How to Set in Render
1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Add each variable above
4. Save and redeploy

## Common Issues Causing Production Errors

1. **OAuth redirects fail** → Missing `FRONTEND_URL`
2. **Apollo connection fails** → Missing `APOLLO_CLIENT_ID`, `APOLLO_CLIENT_SECRET`, or wrong `APOLLO_REDIRECT_URI`
3. **Firebase errors** → Missing `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_USE_EMULATORS=true` in production
4. **File URLs broken** → Missing `BACKEND_URL`

