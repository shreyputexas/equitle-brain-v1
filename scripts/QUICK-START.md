# Quick Start: Upload Video to Firebase Storage

## Step 1: Create Firebase Storage Bucket (if not exists)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `equitle-brain-dev`
3. Click **"Storage"** in the left sidebar
4. If you see "Get Started", click it
5. Choose a storage location (e.g., `us-central1`)
6. Accept the default security rules
7. Wait for setup to complete

## Step 2: Run the Upload Script

```bash
node scripts/upload-video-to-firebase.js
```

The script will:
- ✅ Find your service account automatically
- ✅ Upload the 151MB video file
- ✅ Make it publicly accessible
- ✅ Give you the CDN URL

## Step 3: Set Environment Variable

After upload, you'll get a URL like:
```
https://storage.googleapis.com/equitle-brain-dev.appspot.com/public/autoplay_website.mp4
```

### For Render (Production):

1. Go to Render dashboard → Your frontend service
2. Environment tab → Add:
   - **Key**: `VITE_VIDEO_URL`
   - **Value**: `https://storage.googleapis.com/equitle-brain-dev.appspot.com/public/autoplay_website.mp4`
3. Save and redeploy

### For Local Development:

Add to `.env`:
```
VITE_VIDEO_URL=https://storage.googleapis.com/equitle-brain-dev.appspot.com/public/autoplay_website.mp4
```

## That's it! 🎉

The video will now load from Firebase Storage CDN instead of your server.

