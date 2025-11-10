# Apollo Webhook Implementation for Phone Numbers

## Overview
Implemented webhook support to receive phone numbers from Apollo API. Apollo requires a `webhook_url` parameter when using `reveal_phone_number: true` in enrichment requests.

## Implementation Details

### 1. Webhook Service (`server/src/services/apolloWebhook.service.ts`)
- In-memory store for phone numbers received via webhook
- Stores phone numbers by person_id or enrichment_request_id
- Auto-cleanup of entries older than 1 hour
- Methods to retrieve phone numbers by identifier or person ID

### 2. Webhook Endpoint (`server/src/routes/apollo.ts`)
- **POST** `/api/apollo/webhook/phone-numbers` - Receives phone numbers from Apollo
- **GET** `/api/apollo/webhook/phone-numbers/:identifier` - Retrieves stored phone numbers (for debugging)
- No authentication required (public endpoint for Apollo to call)

### 3. Apollo Service Updates (`server/src/services/apollo.service.ts`)
- Automatically generates webhook URL from `BACKEND_URL` or `BASE_URL` environment variable
- Includes `reveal_phone_number: true` and `webhook_url` in all enrichment requests
- Polls webhook store after enrichment (waits up to 4.5 seconds for webhook to arrive)
- Merges phone numbers from webhook into enrichment response

### 4. Enrichment Flow Updates (`server/src/routes/dataEnrichment.ts`)
- Uses enhanced enrichment with webhook support
- Checks webhook store for phone numbers
- All contact fields properly populated

## Webhook URL Configuration

The webhook URL is automatically generated from:
1. `APOLLO_WEBHOOK_URL` environment variable (if set)
2. `BACKEND_URL` environment variable
3. `BASE_URL` environment variable  
4. Default: `http://localhost:${PORT}/api/apollo/webhook/phone-numbers`

**For production**, set `BACKEND_URL` or `BASE_URL` to your public API URL:
```bash
BACKEND_URL=https://api.equitle.com
# or
BASE_URL=https://api.equitle.com
```

## How It Works

1. **Enrichment Request**: When enriching a person, the code sends:
   ```json
   {
     "reveal_personal_emails": true,
     "reveal_phone_number": true,
     "webhook_url": "https://your-api.com/api/apollo/webhook/phone-numbers",
     "id": "person_id_here",
     ...
   }
   ```

2. **Apollo Processing**: Apollo processes the request and sends phone numbers asynchronously to the webhook URL

3. **Webhook Receives Data**: Our webhook endpoint receives:
   ```json
   {
     "person_id": "person_id_here",
     "phone_numbers": [
       {
         "raw_number": "+14155551234",
         "sanitized_number": "+14155551234",
         "type": "mobile"
       }
     ]
   }
   ```

4. **Phone Numbers Stored**: Webhook service stores phone numbers in memory

5. **Enrichment Checks Store**: After API response, code polls webhook store (up to 4.5 seconds) to retrieve phone numbers

6. **Merged Response**: Phone numbers from webhook are merged into the final enrichment result

## Testing

The webhook endpoint is accessible at:
- **POST** `/api/apollo/webhook/phone-numbers` - Receive phone numbers
- **GET** `/api/apollo/webhook/phone-numbers/:identifier` - Check stored phone numbers

### Test Webhook Manually:
```bash
curl -X POST http://localhost:4001/api/apollo/webhook/phone-numbers \
  -H "Content-Type: application/json" \
  -d '{
    "person_id": "test123",
    "phone_numbers": [
      {
        "raw_number": "+14155551234",
        "sanitized_number": "+14155551234",
        "type": "mobile"
      }
    ]
  }'
```

## Console Logging

The implementation includes comprehensive console logging:
- `🔍 [ENRICHMENT]` - Initial search results
- `🚀 [ENRICHMENT]` - Starting enrichment
- `📞 [ENRICHMENT]` - Enrichment steps
- `✅ [ENRICHMENT]` - Success with phone numbers
- `📧 [ENRICHMENT]` - Email Finder API
- `📋 [FINAL CONTACT]` - Final contact object
- `📊 [ENRICHMENT SUMMARY]` - Overall statistics
- `✅ [WEBHOOK]` - Phone numbers received via webhook

## Current Status

✅ **Implemented**:
- Webhook endpoint created
- Webhook service for storing phone numbers
- Apollo service updated to use webhook URL
- Polling mechanism to wait for webhook
- Enhanced logging

⚠️ **Note**: 
- Webhook URL must be publicly accessible for Apollo to call it
- Phone numbers arrive asynchronously (may take 1-5 seconds)
- In development, use ngrok or similar tool to expose localhost
- In production, ensure `BACKEND_URL` or `BASE_URL` is set correctly

## Next Steps

1. **Test in Production**: Deploy and test with real Apollo webhook calls
2. **Monitor Webhook**: Check webhook logs to see if Apollo is calling it
3. **Verify Phone Numbers**: Confirm phone numbers are being received and stored
4. **Optimize Wait Time**: Adjust polling duration based on actual webhook delivery times

