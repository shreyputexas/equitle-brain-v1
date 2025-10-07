# Fix Apollo API Key Validation

## Problem
The API key validation was failing with "Failed to fetch" error. This was caused by a CORS issue - the frontend was running on port 3012, but the server's CORS was only configured for ports 3000, 3001, and 3002.

## Solution
1. Simplified the `validateApiKey()` method in apollo.service.ts
2. Added port 3012 to the CORS configuration in server/src/index.ts
3. Added debug logging to the frontend

## Tasks
- [x] Simplify validateApiKey method in apollo.service.ts
- [x] Fix CORS configuration to allow port 3012
- [x] Add debug logging to frontend
- [x] Restart server with new CORS settings
- [ ] Test the validation to confirm it works

---

## Review Section

### Changes Made

**1. File: `server/src/services/apollo.service.ts` (lines 504-544)**
- Simplified `validateApiKey()` from 70+ lines to ~40 lines
- Removed complex conditionals
- Now makes a simple test API call with `{ per_page: 1 }`
- Returns `true` if status is 200, `false` for any error

**2. File: `server/src/index.ts` (lines 46-56 and 98-106)**
- Added `"http://localhost:3012"` to CORS origins for Socket.IO
- Added `"http://localhost:3012"` to CORS origins for Express app
- This allows the frontend running on port 3012 to make API requests

**3. File: `src/pages/DataEnrichment.tsx` (lines 461-515)**
- Added console logging to debug API validation
- Better error messages showing server status
- Logs request URL, response status, and error details

### Root Cause
The frontend was running on port 3012, but the server's CORS configuration only allowed ports 3000, 3001, and 3002. This caused the browser to block all API requests with a "Failed to fetch" error.

### Testing
Server has been restarted with the new CORS configuration. Please try validating your Apollo API key again - it should now work properly.
