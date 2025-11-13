# How to Upload Video to Firebase Storage

This guide will help you upload the `autoplay_website.mp4` video to Firebase Storage so it can be served via CDN.

## Prerequisites

1. **Firebase Storage Bucket** must exist and be configured
2. **Firebase Service Account** credentials (JSON file or environment variable)

## Step 1: Check Your Firebase Configuration

Make sure you have these environment variables set (or the service account file locally):

- `FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket name (e.g., `equitle-brain-dev.appspot.com`)
- `FIREBASE_SERVICE_ACCOUNT_JSON` - OR `FIREBASE_SERVICE_ACCOUNT_PATH` - Firebase service account credentials

## Step 2: Run the Upload Script

```bash
node scripts/upload-video-to-firebase.js
```

The script will:
1. ✅ Check if the video file exists (`public/autoplay_website.mp4`)
2. ✅ Upload it to Firebase Storage at `public/autoplay_website.mp4`
3. ✅ Make it publicly accessible
4. ✅ Give you the public CDN URL

## Step 3: Copy the Public URL

After running the script, you'll get a URL like:
```
https://storage.googleapis.com/equitle-brain-dev.appspot.com/public/autoplay_website.mp4
```

## Step 4: Set Environment Variable

### For Render (Production):

1. Go to your **Render dashboard**
2. Select your **frontend service** (the one that serves the React app)
3. Go to **Environment** tab
4. Add new variable:
   - **Key**: `VITE_VIDEO_URL`
   - **Value**: `https://storage.googleapis.com/YOUR-BUCKET/public/autoplay_website.mp4`
5. **Save** and **Redeploy**

### For Local Development:

Add to your `.env` file:
```
VITE_VIDEO_URL=https://storage.googleapis.com/YOUR-BUCKET/public/autoplay_website.mp4
```

## Step 5: Verify

After redeploying, the video should load from Firebase Storage CDN instead of your local server.

## Troubleshooting

### Error: "The specified bucket does not exist"
- Check your `FIREBASE_STORAGE_BUCKET` environment variable
- Make sure the bucket exists in Firebase Console
- Format should be: `your-project-id.appspot.com`

### Error: "No Firebase service account found"
- Set `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable with the JSON content
- OR set `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to the JSON file
- OR place the service account file at: `equitle-brain-dev-firebase-adminsdk-fbsvc-f95ee42ed1.json`

### Video not loading after upload
- Make sure the file was made public (the script does this automatically)
- Check Firebase Storage rules allow public read access to `public/` folder
- Verify the URL is correct in your environment variable

## Benefits of Using Firebase Storage

✅ **CDN Delivery** - Fast global delivery  
✅ **No Git Bloat** - Large files don't go in your repo  
✅ **Scalable** - Handles large files efficiently  
✅ **Reliable** - Google's infrastructure  

