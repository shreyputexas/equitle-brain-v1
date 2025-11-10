# Contact Enrichment Fix Plan

## Problem Summary
Contacts found via "Find Contacts" are missing email and phone numbers. The enrichment process is failing because:
1. Domain extraction is incomplete (only uses `primary_domain`, doesn't fallback to `website_url`)
2. Enrichment API calls may be failing silently
3. Missing retry logic for transient failures
4. Phone numbers not being extracted from all available sources

## Solution Overview
Implement a robust enrichment pipeline that ensures all contact fields (email, phone, title, LinkedIn, company info, etc.) are populated through multiple fallback strategies.

---

## Implementation Plan

### Phase 1: Domain Extraction & Fallback Logic

**File**: `server/src/routes/dataEnrichment.ts`

**Changes**:
1. Create helper function `extractDomainFromOrganization()` that:
   - First tries `organization.primary_domain`
   - Falls back to extracting domain from `organization.website_url`
   - Uses `cleanDomain()` utility if needed
   - Returns null if no domain can be extracted

2. Update enrichment call (line ~1690) to use extracted domain:
   ```typescript
   const domain = extractDomainFromOrganization(person.organization);
   ```

**Location**: Add function before `multiTierSearch` function (around line 197)

---

### Phase 2: Enhanced Enrichment Strategy

**File**: `server/src/routes/dataEnrichment.ts` (lines 1647-1817)

**Changes**:
1. **Use Apollo ID when available** (line ~1686):
   - Pass `id: person.id` to enrichment if available
   - Apollo ID-based enrichment has higher success rate

2. **Multi-step enrichment with fallbacks**:
   - Step 1: Try `enrichPerson()` with all available data
   - Step 2: If fails, try `enrichPersonData()` directly with ID
   - Step 3: If still fails, try `enrichPersonData()` with name + domain
   - Step 4: Try Email Finder API for email
   - Step 5: Try Phone Finder if available

3. **Extract phone from multiple sources**:
   - Check `enrichmentResult.phone_numbers` array (all entries)
   - Prefer `sanitized_number` over `raw_number`
   - Check multiple phone types (mobile, direct, office)

---

### Phase 3: Retry Logic & Error Handling

**File**: `server/src/routes/dataEnrichment.ts`

**Changes**:
1. Add retry wrapper function `enrichWithRetry()`:
   - Retry up to 2 times on failure
   - Exponential backoff (100ms, 200ms)
   - Only retry on network/timeout errors, not 400/404

2. Wrap enrichment calls with retry logic

3. Enhanced error logging:
   - Log enrichment request parameters
   - Log response status and data
   - Log which fallback strategy succeeded

---

### Phase 4: Complete Field Population

**File**: `server/src/routes/dataEnrichment.ts` (lines 1780-1804)

**Changes**:
1. Ensure all fields are populated from enriched data:
   - **Email**: From enrichment → Email Finder → search result
   - **Phone**: From enrichment → search result (check all phone_numbers)
   - **Title**: From enrichment → search result
   - **LinkedIn**: From enrichment → search result
   - **Company**: From enrichment.organization → search result
   - **Website**: From organization.website_url → primary_domain
   - **Domain**: From primary_domain → extracted from website_url
   - **Industry**: From organization.industry
   - **Company Size**: From organization.employee_count
   - **Location**: From city + state
   - **Photo**: From photo_url

2. Merge strategy: Always prefer enriched data over search results

---

### Phase 5: Apollo Service Enhancements

**File**: `server/src/services/apollo.service.ts`

**Changes**:
1. **Enhance `enrichPersonData()`** (line ~462):
   - Ensure domain is always passed when available
   - Add better logging for missing domain cases
   - Handle cases where domain extraction from website_url is needed

2. **Improve phone number extraction**:
   - Check all phone_numbers in array
   - Prefer mobile/direct over office
   - Return best available phone number

---

## Implementation Details

### Helper Function: `extractDomainFromOrganization()`

```typescript
function extractDomainFromOrganization(organization?: any): string | undefined {
  if (!organization) return undefined;
  
  // First try primary_domain
  if (organization.primary_domain) {
    return cleanDomain(organization.primary_domain);
  }
  
  // Fallback to website_url
  if (organization.website_url) {
    try {
      const url = new URL(organization.website_url);
      return cleanDomain(url.hostname);
    } catch (e) {
      // If URL parsing fails, try cleaning the string directly
      return cleanDomain(organization.website_url);
    }
  }
  
  return undefined;
}
```

### Enhanced Enrichment Flow

```typescript
// 1. Extract domain with fallback
const domain = extractDomainFromOrganization(person.organization) || 
               extractDomainFromOrganization(enrichedData.organization);

// 2. Try enrichment with ID first (highest success rate)
let enrichmentResult = null;
if (person.id) {
  enrichmentResult = await apolloService.enrichPersonData({
    id: person.id,
    domain: domain,
    organization_name: person.organization?.name
  });
}

// 3. Fallback to name-based enrichment
if (!enrichmentResult) {
  enrichmentResult = await apolloService.enrichPerson({
    first_name: person.first_name,
    last_name: person.last_name,
    organization_name: person.organization?.name,
    domain: domain,
    email: cleanEmail
  });
}

// 4. Extract best phone number
const bestPhone = getBestPhoneNumber(enrichmentResult?.phone_numbers || person.phone_numbers || []);
```

### Phone Number Extraction Helper

```typescript
function getBestPhoneNumber(phoneNumbers: Array<{raw_number?: string, sanitized_number?: string, type?: string}>): string {
  if (!phoneNumbers || phoneNumbers.length === 0) return '';
  
  // Prefer sanitized_number over raw_number
  // Prefer mobile/direct over office
  const mobile = phoneNumbers.find(p => p.type?.toLowerCase().includes('mobile') && p.sanitized_number);
  if (mobile) return mobile.sanitized_number;
  
  const direct = phoneNumbers.find(p => p.type?.toLowerCase().includes('direct') && p.sanitized_number);
  if (direct) return direct.sanitized_number;
  
  // Return first available sanitized number
  const firstSanitized = phoneNumbers.find(p => p.sanitized_number);
  if (firstSanitized) return firstSanitized.sanitized_number;
  
  // Last resort: raw number
  const firstRaw = phoneNumbers.find(p => p.raw_number);
  return firstRaw?.raw_number || '';
}
```

---

## Testing Checklist

- [ ] Test with contacts that have `primary_domain`
- [ ] Test with contacts that only have `website_url`
- [ ] Test with contacts missing both domain fields
- [ ] Test enrichment with Apollo ID
- [ ] Test enrichment without Apollo ID (name-based)
- [ ] Test email extraction via Email Finder API
- [ ] Test phone number extraction from multiple sources
- [ ] Test retry logic on transient failures
- [ ] Verify all contact fields are populated
- [ ] Test with brokers and investors contact types

---

## Expected Outcomes

After implementation:
1. ✅ **Email**: Populated from enrichment → Email Finder → search result (in order)
2. ✅ **Phone**: Populated from enrichment → search result (best available)
3. ✅ **All Fields**: Title, LinkedIn, Company, Website, Domain, Industry, Size, Location, Photo
4. ✅ **Success Rate**: Higher enrichment success due to domain fallback and retry logic
5. ✅ **Reliability**: Better error handling and logging for debugging

---

## Files to Modify

1. `server/src/routes/dataEnrichment.ts`
   - Add `extractDomainFromOrganization()` helper
   - Add `getBestPhoneNumber()` helper
   - Add `enrichWithRetry()` wrapper (optional)
   - Update enrichment loop (lines 1647-1817)
   - Update final contact object building (lines 1780-1804)

2. `server/src/services/apollo.service.ts` (optional enhancements)
   - Improve error messages
   - Add domain extraction logging

---

## Rollout Strategy

1. **Phase 1-2**: Implement domain extraction and enhanced enrichment (critical fixes)
2. **Phase 3**: Add retry logic (improves reliability)
3. **Phase 4**: Ensure complete field population (polish)
4. **Phase 5**: Apollo service enhancements (optional optimizations)

Test each phase before moving to the next.

