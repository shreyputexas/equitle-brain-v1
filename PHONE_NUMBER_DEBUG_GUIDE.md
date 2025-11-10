# Phone Number & Email Enrichment Debugging Guide

## Changes Made

### 1. **Switched to Correct Apollo Enrichment Endpoint**
- **Old**: Used `/v1/mixed_people/search` (doesn't return phone numbers)
- **New**: Now uses `/v1/people/enrich` (correct endpoint for phone numbers)

### 2. **3-Step Enrichment Strategy**
The system now tries multiple approaches:
1. **Step 1**: Direct enrichment endpoint (best for phone numbers)
2. **Step 2**: Match then enrich (if step 1 fails)
3. **Step 3**: Search then enrich (for company-only searches)

### 3. **Added Detailed Logging**
New log messages with emojis for easy identification:
- 🔍 Using Apollo People Enrichment endpoint
- 📤 Enrichment API Request
- 📥 Enrichment API Raw Response
- ✅ Apollo enrichment endpoint successful
- ⚠️ Warning messages for missing data
- ❌ Error messages

### 4. **Permission Checking**
The API key validation now tests if your Apollo account has phone number access permissions.

---

## How to Debug

### Step 1: Check Server Logs
Restart your server and run a contact search. Look for these log messages:

```bash
# Start the server (or check existing logs)
npm run dev:server

# In another terminal, tail the logs
tail -f server/logs/* | grep -E "🔍|📤|📥|✅|⚠️|❌"
```

### Step 2: Look for These Key Indicators

#### ✅ **Good Signs**:
```
✅ Apollo enrichment endpoint successful
phoneCount: 1
firstPhone: +1-555-123-4567
```

#### ⚠️ **Warnings to Watch For**:
```
⚠️ Enrichment succeeded but NO PHONE NUMBERS returned from Apollo API
```
This means Apollo API responded but doesn't have phone numbers for this contact.

```
⚠️ PHONE NUMBER ACCESS MAY BE RESTRICTED
Your Apollo plan may not include phone number access
```
This means your Apollo account doesn't have permission to access phone numbers.

#### ❌ **Error Signs**:
```
❌ Apollo people enrichment failed
status: 402 (Payment Required)
status: 403 (Forbidden)
```

---

## Common Issues & Solutions

### Issue 1: "Apollo doesn't have phone numbers for this contact"

**Why**: Not all contacts in Apollo's database have phone numbers.

**Solution**:
- Try searching for C-level executives (CEOs, CTOs) - they're more likely to have phone numbers
- Try different contacts at the same company
- Check the contact on Apollo.io directly to confirm they have a phone number

### Issue 2: "Phone number access restricted (402/403 error)"

**Why**: Your Apollo plan doesn't include phone number access or you've hit credit limits.

**Solution**:
- Check your Apollo plan at https://app.apollo.io/settings/billing
- Upgrade to a plan that includes phone number access
- Check if you have remaining credits

### Issue 3: "Enrichment endpoint not being called"

**Why**: The enrichment might be failing silently earlier in the process.

**Solution**:
- Check server logs for the 🔍 emoji - this confirms enrichment is being attempted
- Look for 📤 to see the exact API request being sent
- Check for ❌ errors that might be blocking the enrichment

### Issue 4: "Email works but phone doesn't"

**Why**: Apollo treats phone numbers and emails differently. Emails might be in a free tier, but phones require paid access.

**Solution**:
- Verify your Apollo plan includes mobile phone access
- Check Apollo API documentation for your specific plan limits

---

## Testing Steps

### 1. Test with Known Contact
Try searching for a contact you KNOW has a phone number on Apollo.io:

1. Go to https://app.apollo.io
2. Search for a contact
3. Verify they have a phone number visible
4. Search for that same contact in your app
5. Check the logs for the enrichment response

### 2. Check Raw API Response
The logs now show the **full raw response** from Apollo:

```
📥 Enrichment API Raw Response:
fullResponse: {
  "person": {
    "phone_numbers": [
      {
        "raw_number": "+1-555-123-4567",
        "sanitized_number": "5551234567",
        "type": "mobile"
      }
    ]
  }
}
```

If `phone_numbers` is an empty array `[]`, Apollo doesn't have the data.

### 3. Manual API Test
Test Apollo API directly using curl:

```bash
curl -X POST https://api.apollo.io/v1/people/enrich \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d '{
    "first_name": "Elon",
    "last_name": "Musk",
    "organization_name": "Tesla",
    "reveal_phone_number": true
  }'
```

Check if the response includes `phone_numbers`.

---

## Expected Behavior

### When Everything Works:
1. Search for contacts
2. See log: `🔍 Using Apollo People Enrichment endpoint`
3. See log: `📤 Enrichment API Request: reveal_phone_number: true`
4. See log: `📥 Enrichment API Raw Response: phoneNumbersLength: 1`
5. See log: `✅ Apollo enrichment endpoint successful phoneCount: 1`
6. Phone number appears in UI

### When Phone Data is Missing:
1. Search for contacts
2. See log: `🔍 Using Apollo People Enrichment endpoint`
3. See log: `⚠️ Enrichment succeeded but NO PHONE NUMBERS returned`
4. "Not Found" appears in UI (because Apollo doesn't have the data)

---

## Next Steps if Still Not Working

1. **Share server logs** - Copy logs containing 🔍📤📥 emojis
2. **Check Apollo account**:
   - Go to https://app.apollo.io/settings/credits
   - Check remaining credits
   - Verify plan includes phone numbers
3. **Test on Apollo.io directly** - Search for the same contact and verify phone is visible
4. **Check API key permissions** - Some API keys have restricted scopes

---

## Quick Reference: What Changed

| Component | Old Behavior | New Behavior |
|-----------|-------------|--------------|
| Search | Only used `/mixed_people/search` | Search → Enrich pipeline |
| Phone Numbers | Not available (wrong endpoint) | Available via `/people/enrich` |
| Logging | Basic logs | Detailed emoji logs |
| Error Handling | Silent failures | Clear warnings/errors |
| Permissions | No check | Checks phone access on validation |

---

## Contact

If you're still seeing "Not Found" after:
1. Verifying Apollo has the data
2. Checking your plan includes phone access
3. Reviewing the server logs

Then there may be a specific API issue that needs deeper investigation.
