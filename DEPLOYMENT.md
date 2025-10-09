# Deployment Guide

## Environment Configuration

This app is configured to work seamlessly across different environments without hardcoded URLs.

### Development (Current)
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:4001`
- Uses `.env.development` or falls back to localhost

### Production (When you deploy)
- Frontend: `https://equitle.com` (or your domain)
- Backend API: `https://api.equitle.com` (or your API domain)
- Uses `.env.production` with production URLs

## How It Works

### 1. Smart Environment Detection
- **Development**: Automatically uses `localhost:4001`
- **Production**: Automatically uses `https://api.equitle.com`
- **Override**: Set `VITE_API_BASE_URL` in environment to override

### 2. Environment Files
- `.env` - Default values
- `.env.development` - Development overrides
- `.env.production` - Production values

### 3. Deploy-time Configuration
When you deploy to production (Vercel, Netlify, etc.):

```bash
# Set these environment variables in your hosting platform:
VITE_API_BASE_URL=https://api.equitle.com
VITE_FIREBASE_USE_EMULATORS=false
```

## For Your Friend (Development)
Your friend should just run locally:
```bash
git pull
npm install
npm run dev
```

No IP address configuration needed - it automatically uses localhost.

## When You Deploy to Production
1. **Frontend**: Deploy to Vercel/Netlify with `VITE_API_BASE_URL=https://api.equitle.com`
2. **Backend**: Deploy API to Railway/Render/AWS with your Firebase production config
3. **DNS**: Point `api.equitle.com` to your backend server

The app will automatically detect the production environment and use production URLs.

## Current Status
✅ Removed all hardcoded localhost URLs
✅ Environment-aware configuration
✅ Development works with localhost
✅ Production ready for deployment
✅ Firebase already configured for production