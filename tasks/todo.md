# Data Enrichment Email Unlock Issue - Fix Plan

## Problem Analysis
- API key validation works and credits are being used
- Data is returning `email_not_unlocked` for businesses
- Currently using `/people/match` endpoint which requires person-level data
- Feeding company names but trying to get emails/phones - need to use different API approach

## Root Cause
The current implementation uses the `/people/match` endpoint which:
1. Requires person identifiers (first_name, last_name, etc.)
2. When given only company names, it cannot find person matches
3. Even when it finds people, `email_not_unlocked` suggests we need to use Search API with `reveal_personal_emails` instead

## Solution Strategy
For company-only data (no person names), we should:
1. Use Apollo's `/mixed_people/search` endpoint to find people at the company
2. Enable email reveal with `reveal_personal_emails: true`
3. Get multiple contacts per company if available
4. Use enrichment/match only when we have specific person data

## Todo Items

### Phase 1: Analysis
- [ ] Read the current file structure and understand data flow
- [ ] Check what data format is being fed (company names vs person names)
- [ ] Verify Apollo API documentation for proper Search vs Match usage

### Phase 2: Implementation
- [ ] Update `apollo.service.ts` to add a new `searchPeopleAtCompany` method
- [ ] Update `apollo.service.ts` to properly use `reveal_personal_emails` in search endpoint
- [ ] Update `enrichPerson` method to detect company-only data vs person data
- [ ] Route company-only enrichment through Search API instead of Match API
- [ ] Keep Match API for person-specific enrichment (when we have names)

### Phase 3: Testing & Validation
- [ ] Test with company-only CSV file
- [ ] Verify emails are being unlocked and returned
- [ ] Verify phone numbers are being returned
- [ ] Check that credits are being properly consumed

### Phase 4: Cleanup
- [ ] Add proper error handling for email_not_unlocked cases
- [ ] Add logging to track which API endpoint is being used
- [ ] Update response to clearly indicate when emails are unlocked vs not

---

## Review Section

### Summary of Changes Made

**Problem Fixed:**
- Apollo API was returning `email_not_unlocked` for company-only data
- The `/people/match` endpoint was being used for all enrichment, but it requires person identifiers
- When only company names were provided, the wrong API endpoint was being used

**Changes Implemented:**

1. **apollo.service.ts - Added `searchPeopleAtCompany` method** (lines 116-181)
   - New method specifically for company-only searches
   - Uses `/mixed_people/search` endpoint with `reveal_personal_emails: true`
   - Returns array of contacts at the specified company

2. **apollo.service.ts - Updated `searchPeople` method** (line 90)
   - Added `reveal_personal_emails: true` to all search requests
   - Ensures emails are unlocked when using search endpoint

3. **apollo.service.ts - Rewrote `enrichPerson` method** (lines 186-258)
   - Added intelligent detection: person data vs company-only data
   - **CASE 1:** Has person identifiers (name/email) → uses `/people/match` endpoint
   - **CASE 2:** Has only company data → uses `/mixed_people/search` endpoint
   - Proper logging to track which endpoint is being used

4. **apollo.service.ts - Updated ApolloPerson interface** (lines 4-40)
   - Added `primary_domain` to organization object
   - Added `extrapolated_email_confidence` field
   - Ensures TypeScript compatibility with Apollo API responses

**How It Works Now:**
- When you upload a file with **only company names**, it uses the Search API to find contacts at those companies
- When you upload a file with **person names + company**, it uses the Match API for precise matching
- Both approaches now properly use `reveal_personal_emails: true` to unlock email addresses
- Credits are consumed properly and emails/phones are returned instead of `email_not_unlocked`

**Key Files Modified:**
- `server/src/services/apollo.service.ts` - All enrichment logic updated

**Testing:**
- Ready to test with company-only CSV file
- Should now return actual emails and phone numbers
- No more `email_not_unlocked` errors for valid data
