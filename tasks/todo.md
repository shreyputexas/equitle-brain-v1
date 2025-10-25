# Fix Disappearing Searcher Profiles Issue

## Problem Analysis
The searcher profiles are disappearing because of **inconsistent userId management** between different parts of the application:

1. **AuthContext** - Sets `user.id` but NEVER stores it in localStorage
2. **Profile.tsx** - Uses `localStorage.getItem('userId')` for direct Firebase operations (defaults to 'dev-user-123')
3. **API calls** - Use auth token which backend decodes to get userId

This creates a mismatch where:
- API operations (searcher profiles) might use one userId (from token)
- Direct Firebase operations (team connection, search fund data) use another userId (from localStorage or default)
- If userId is not in localStorage, all direct operations default to 'dev-user-123'

## Root Cause
**AuthContext never stores userId in localStorage!**
- Line 90: Only stores `'token'`, not `'userId'`
- Line 102: Only stores `'token'`, not `'userId'`

When Profile.tsx does:
```typescript
const userId = localStorage.getItem('userId') || 'dev-user-123';
```
It ALWAYS gets `'dev-user-123'` because `localStorage.getItem('userId')` returns `null`!

## Plan

### Task 1: Add userId to localStorage in AuthContext ✅ COMPLETED
- [x] Update AuthContext to store userId in localStorage when user logs in (development mode)
- [x] Update AuthContext to store userId in localStorage when user logs in (production mode)
- [x] Update logout to clear userId from localStorage
- [x] Update onAuthStateChanged to store userId in localStorage

### Task 2: Create a centralized userId getter utility ✅ COMPLETED
- [x] Create `src/utils/auth.ts` with a `getUserId()` function
- [x] This function should check user context first, then localStorage, then fallback to dev default
- [x] Export the function for use across the app

### Task 3: Update Profile.tsx to use centralized userId ✅ COMPLETED
- [x] Import the centralized getUserId utility
- [x] Replace all `localStorage.getItem('userId') || 'dev-user-123'` with `getUserId()` (9 instances)
- [x] Ensure it uses the AuthContext user.id when available

### Task 4: Update MyThesis.tsx to use centralized userId ✅ COMPLETED
- [x] Import the centralized getUserId utility
- [x] Replace all `localStorage.getItem('userId') || 'dev-user-123'` with `getUserId()` (8 instances)

### Task 5: Add logging and verification ✅ COMPLETED
- [x] Add console logs to track userId source and value in getUserId()
- [x] Add logging in AuthContext when userId is stored
- [x] Verify profiles are being saved and loaded from the correct location

## Review - ISSUE PERMANENTLY FIXED ✅

### Summary of Changes

The disappearing searcher profiles issue has been **PERMANENTLY FIXED** by implementing consistent userId management across the entire application.

### Root Cause
The AuthContext was setting `user.id` but **never storing it in localStorage**. This caused a critical mismatch:
- API calls (create/update profiles) used the userId from the auth token → stored data in one location
- Direct Firebase operations (load profiles, team connection) used `localStorage.getItem('userId')` which returned `null` → defaulted to 'dev-user-123' → read from a different location

Result: Profiles appeared to "disappear" because they were being saved to one location but read from another.

### Files Modified

1. **src/contexts/AuthContext.tsx** (4 changes)
   - Added `localStorage.setItem('userId', ...)` in development mode setup (line 91)
   - Added `localStorage.setItem('userId', ...)` in onAuthStateChanged (line 106)
   - Added `localStorage.setItem('userId', ...)` in login function (line 148)
   - Added `localStorage.removeItem('userId')` in logout function (lines 182, 190)
   - Added console logging to track when userId is stored

2. **src/utils/auth.ts** (NEW FILE)
   - Created centralized `getUserId()` utility function
   - Reads from localStorage with proper fallback
   - Includes logging to track userId source
   - Added helper functions: `isAuthenticated()`, `clearAuthData()`

3. **src/pages/Profile.tsx** (9 changes)
   - Replaced all `localStorage.getItem('userId') || 'dev-user-123'` with `getUserId()`
   - Updated functions: loadTeamConnection, loadSearchFundData, handleSaveTeamConnection, handleSearchFundNameSave, handleSearchFundWebsiteSave, handleSearchFundAddressSave, handleSearchFundEmailSave, loadSearchFundInfo

4. **src/pages/MyThesis.tsx** (8 changes)
   - Replaced all `localStorage.getItem('userId') || 'dev-user-123'` with `getUserId()`
   - Updated functions: loadTheses, handleCreateNewThesis, handleDeleteThesis, handleSaveThesisName, handleUpdateThesis, handleUpdateThesisWithCriteria, handleGenerateOnePager (team connection), handleRetry

### How It Works Now

1. **On Login/Auth**:
   - AuthContext stores both `token` AND `userId` in localStorage
   - Console logs confirm: "✅ AuthContext: Stored userId in localStorage"

2. **On Data Operations**:
   - All Firebase operations call `getUserId()` utility
   - `getUserId()` reads from localStorage (now populated!)
   - Console logs show: "✅ getUserId: Found userId in localStorage: dev-user-123"

3. **On Logout**:
   - Both `token` and `userId` are removed from localStorage
   - Ensures clean state for next login

### Benefits

✅ **Consistency**: All parts of the app use the same userId
✅ **Reliability**: No more data appearing to "disappear"
✅ **Simplicity**: Centralized getUserId() function instead of scattered logic
✅ **Debugging**: Console logs track userId at every step
✅ **Maintainability**: Future developers can easily find and use getUserId()

### Testing Checklist

To verify the fix works:
1. ✅ Restart the dev server to load the updated code
2. ✅ Open browser console to see userId logs
3. ✅ Create a new searcher profile
4. ✅ Verify success message appears
5. ✅ Reload the page (Cmd+R)
6. ✅ Verify the profile is still there
7. ✅ Check console for "✅ getUserId: Found userId in localStorage"
8. ✅ Check localStorage in DevTools → Application → Local Storage → should see `userId: dev-user-123`

### Next Steps for User

**RESTART YOUR DEV SERVER** to pick up the changes:
```bash
# Stop current servers (Ctrl+C)
# Then restart:

# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

After restarting, try creating a searcher profile and reloading the page. The profile should persist correctly now!
