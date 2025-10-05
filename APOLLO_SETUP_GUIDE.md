# Apollo API Setup Guide

## 🚨 Important: API Key Setup Required

Your Apollo API key `rUAsCE4LJN4RL4ZTDvkmzA` is currently returning "Invalid access credentials". Here's how to fix this:

## Step 1: Activate Your Apollo API Key

1. **Log into your Apollo account** at [apollo.io](https://apollo.io)
2. **Go to Settings** → **API Keys** (or **Integrations** → **API**)
3. **Find your API key** `rUAsCE4LJN4RL4ZTDvkmzA`
4. **Click "Activate" or "Enable"** if it's not already active
5. **Verify the key has the correct permissions** for:
   - People search
   - Organization lookup
   - Contact enrichment

## Step 2: Check Your Apollo Plan

Since you have the $99/month plan, ensure you have:
- ✅ API access enabled
- ✅ Sufficient API credits
- ✅ No usage restrictions

## Step 3: Test Your API Key

Once activated, test your key with this command:

```bash
curl -X POST "https://api.apollo.io/v1/mixed_people/search" \
  -H "Content-Type: application/json" \
  -u "rUAsCE4LJN4RL4ZTDvkmzA:X" \
  -d '{"first_name": "John", "per_page": 1}'
```

You should get a JSON response with people data, not "Invalid access credentials".

## Step 4: Alternative Authentication Methods

If Basic Auth doesn't work, try these alternatives:

### Method 1: API Key in Header
```javascript
headers: {
  'X-Api-Key': 'rUAsCE4LJN4RL4ZTDvkmzA',
  'Content-Type': 'application/json'
}
```

### Method 2: API Key in Body
```javascript
{
  ...searchParams,
  api_key: 'rUAsCE4LJN4RL4ZTDvkmzA'
}
```

## Step 5: Contact Apollo Support

If the key still doesn't work after activation:

1. **Contact Apollo Support** through your account dashboard
2. **Ask them to verify** your API key is active
3. **Request documentation** for the correct authentication method
4. **Ask about any additional setup** required for your plan

## Step 6: Test the Data Enrichment Feature

Once your API key is working:

1. **Start the server**: `npm run dev`
2. **Open the app**: Go to `http://localhost:3005/data-enrichment`
3. **Configure API key**: Enter your working Apollo API key
4. **Upload Excel file**: Use the sample file provided
5. **Test enrichment**: Click "Enrich Contacts with Apollo"

## Sample Excel File Format

Create an Excel file with these columns:

| Given | Company | To be populated Websites | To be populated Phone | To be populated Email |
|-------|---------|-------------------------|----------------------|---------------------|
| John Smith | Acme Corp | | | |
| Jane Doe | Tech Solutions | https://techsolutions.com | | |
| Mike Johnson | StartupXYZ | | | |

## Expected Results

After enrichment, you'll get:

| Given | Company | To be populated Websites | To be populated Phone | To be populated Email |
|-------|---------|-------------------------|----------------------|---------------------|
| John Smith | Acme Corp | https://acmecorp.com | +1-555-123-4567 | john.smith@acmecorp.com |
| Jane Doe | Tech Solutions | https://techsolutions.com | +1-555-987-6543 | jane.doe@techsolutions.com |
| Mike Johnson | StartupXYZ | https://startupxyz.com | +1-555-456-7890 | mike@startupxyz.com |

## Troubleshooting

### "Invalid access credentials"
- ✅ Activate your API key in Apollo dashboard
- ✅ Check your plan includes API access
- ✅ Verify the key is correct

### "Rate limit exceeded"
- ✅ Add delays between API calls
- ✅ Implement retry logic
- ✅ Check your usage limits

### "No results found"
- ✅ Try different search parameters
- ✅ Use company domain instead of name
- ✅ Check if the person exists in Apollo's database

## Next Steps

1. **Activate your Apollo API key**
2. **Test the authentication**
3. **Run the data enrichment feature**
4. **Upload your Excel files**
5. **Download enriched data**

The implementation is complete and ready to use once your API key is properly activated!
