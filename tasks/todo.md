# One-Pager Navy Blue Template Generation Issue

## Problem
Getting alert error "Failed to generate personal pitch. Please try again." when trying to generate a one-pager using the navy blue template.

## Todo Items
- [x] Verify template file path resolution in templateEditor.service.ts - ✅ Path resolves correctly
- [x] Fix SearcherProfile interface mismatch (headshotUrl property missing) - ✅ Added to both files
- [x] Verify searcher profile data flow from Firebase - ✅ Data includes all fields with spread operator
- [ ] Test the generation process after fixes
- [ ] Verify the navy blue template generates successfully

## Root Cause
**SearcherProfile Interface Mismatch**: The `SearcherProfile` interface in `onePagerGeneration.service.ts` and `onePagerApi.ts` was missing the `headshotUrl` property, but the code in `onePagerGeneration.service.ts:369-373` tries to access `profile.headshotUrl` when mapping searcher profiles for template generation.

## Changes Made

### 1. Fixed SearcherProfile Interface (server-side)
**File**: `server/src/services/onePagerGeneration.service.ts`
- Added `headshotUrl?: string;` to the SearcherProfile interface at line 17

### 2. Fixed SearcherProfile Interface (client-side)
**File**: `src/services/onePagerApi.ts`
- Added `headshotUrl?: string;` to the SearcherProfile interface at line 9

### 3. Verified Template Path Resolution
- Confirmed template path resolves correctly to: `/Users/shariqhafizi/equitle-brain-v1-1/equitle-brain-v1-3/equitle-brain-v1/one_pager_templates/navy_blue.docx`
- File exists and is accessible

### 4. Verified Data Flow
- Searcher profiles are loaded from Firebase with all fields using spread operator
- If headshotUrl exists in Firebase, it will be included in the request

## Testing Instructions
1. Make sure both client and server are running (nodemon should auto-reload the server)
2. Navigate to My Thesis page
3. Select a thesis and searcher profile(s)
4. Choose "Navy Blue" template
5. Click "Generate Personal Pitch"
6. The document should generate and download successfully
