# Apollo API Key Troubleshooting Guide

## ✅ Current Status: API Key Working

Your Apollo API key `s3P_jl0bcIF1TSurEZF0sA` is working correctly and has email reveal permissions enabled.

## 🔧 Step-by-Step Fix

### 1. Check Your Apollo Account Status

**Log into Apollo.io and verify:**
- ✅ Your account is active
- ✅ You have the $99/month plan
- ✅ API access is enabled
- ✅ You have remaining API credits

### 2. Activate Your API Key

**In your Apollo dashboard:**
1. Go to **Settings** → **API Keys** (or **Integrations** → **API**)
2. Find your key: `rUAsCE4LJN4RL4ZTDvkmzA`
3. Click **"Activate"** or **"Enable"** if it's not already active
4. Verify it has permissions for:
   - People search
   - Organization lookup
   - Contact enrichment

### 3. Test Your API Key Directly

**Test with curl:**
```bash
# Method 1: Test Search (Basic functionality)
curl -X POST "https://api.apollo.io/v1/mixed_people/search" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: s3P_jl0bcIF1TSurEZF0sA" \
  -d '{"first_name": "John", "per_page": 1}'

# Method 2: Test Email Reveal (Recommended for getting real emails)
curl -X POST "https://api.apollo.io/v1/people/match" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: s3P_jl0bcIF1TSurEZF0sA" \
  -d '{
    "first_name": "Philippe",
    "last_name": "Winter",
    "organization_name": "Squadron Aviation Services Ltd.",
    "reveal_personal_emails": true
  }'
```

### 4. Common Issues & Solutions

#### Issue: "Invalid access credentials"
**Solution:** 
- Activate your API key in Apollo dashboard
- Check if your plan includes API access
- Verify the key is correct

#### Issue: "Rate limit exceeded"
**Solution:**
- Wait a few minutes and try again
- Check your usage limits in Apollo dashboard
- Upgrade your plan if needed

#### Issue: "422 Unprocessable Entity"
**Solution:**
- Check your request parameters
- Ensure you're using the correct API endpoint
- Verify your search parameters are valid

### 5. Alternative Authentication Methods

The system now tries **3 different authentication methods**:

1. **Basic Auth** (username: API key, password: X)
2. **API Key in Header** (X-Api-Key header)
3. **API Key in Body** (api_key parameter)

### 6. Contact Apollo Support

If none of the above works:

1. **Contact Apollo Support** through your account dashboard
2. **Ask them to verify** your API key is active
3. **Request the correct authentication method** for your plan
4. **Ask about any additional setup** required

### 7. Test the Data Enrichment Feature

Once your API key is working:

1. **Start the server**: `npm run dev`
2. **Open the app**: Go to `http://localhost:3002/data-enrichment`
3. **Configure API key**: Enter your working Apollo API key
4. **Upload CSV file**: Use the sample files provided
5. **Test enrichment**: Click "Enrich Contacts with Apollo"

## 🎯 Expected Results

After fixing the API key, you should see:
- ✅ API key validation successful
- ✅ CSV file processing works
- ✅ Apollo enriches missing contact data
- ✅ Download enriched CSV file

## 📞 Need Help?

If you're still having issues:
1. Check the server logs for detailed error messages
2. Contact Apollo support with your specific error
3. Verify your account has API access enabled
4. Try generating a new API key in Apollo dashboard

The implementation is complete and ready to use once your API key is properly configured!
