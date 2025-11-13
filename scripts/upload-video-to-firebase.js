const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// IMPORTANT: Disable Firebase emulators for this script (we want real Firebase Storage)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
delete process.env.FIREBASE_USE_EMULATORS;

// Initialize Firebase Admin
let serviceAccount;

// Try to get service account from environment variable first
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.log('📝 Using service account from environment variable');
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  console.log('📝 Using service account from file path');
  try {
    let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    // If it's a relative path, resolve it
    if (!path.isAbsolute(serviceAccountPath)) {
      serviceAccountPath = path.resolve(__dirname, '..', serviceAccountPath);
    } else {
      serviceAccountPath = path.resolve(serviceAccountPath);
    }
    console.log(`   Path: ${serviceAccountPath}`);
    if (!fs.existsSync(serviceAccountPath)) {
      console.error(`❌ Service account file not found at: ${serviceAccountPath}`);
      process.exit(1);
    }
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (e) {
    console.error('❌ Failed to read service account file:', e.message);
    console.error('   Error details:', e);
    process.exit(1);
  }
} else {
  // Fallback to local file
  const localServiceAccountPath = path.join(__dirname, '..', 'equitle-brain-dev-firebase-adminsdk-fbsvc-f95ee42ed1.json');
  if (fs.existsSync(localServiceAccountPath)) {
    console.log('📝 Using local service account file');
    try {
      serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, 'utf8'));
    } catch (e) {
      console.error('❌ Failed to read local service account file:', e.message);
      process.exit(1);
    }
  } else {
    console.error('❌ No Firebase service account found!');
    console.error('\nOptions:');
    console.error('1. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
    console.error('2. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable');
    console.error('3. Place service account file at: equitle-brain-dev-firebase-adminsdk-fbsvc-f95ee42ed1.json');
    process.exit(1);
  }
}

// Get storage bucket from service account or environment variable
// Try new format first (.firebasestorage.app), fallback to old format (.appspot.com)
let storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  // Try new Firebase Storage format first
  storageBucket = serviceAccount.project_id + '.firebasestorage.app';
  console.log(`📦 Using new Firebase Storage bucket format: ${storageBucket}`);
} else {
  console.log(`📦 Using bucket from environment: ${storageBucket}`);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: storageBucket
});

const bucket = admin.storage().bucket();

async function uploadVideo() {
  try {
    const videoPath = path.join(__dirname, '..', 'public', 'autoplay_website.mp4');
    
    if (!fs.existsSync(videoPath)) {
      console.error('❌ Video file not found at:', videoPath);
      process.exit(1);
    }

    const fileStats = fs.statSync(videoPath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    console.log(`📤 Uploading video to Firebase Storage...`);
    console.log(`   File: ${videoPath}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Bucket: ${storageBucket}`);
    
    const fileName = 'public/autoplay_website.mp4';
    const file = bucket.file(fileName);

    // Upload the file
    console.log('⏳ Uploading... (this may take a while for large files)');
    await file.save(fs.readFileSync(videoPath), {
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    console.log('✅ File uploaded successfully!');

    // Make the file publicly accessible
    console.log('🔓 Making file publicly accessible...');
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${storageBucket}/${fileName}`;
    
    console.log('\n🎉 SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📎 Public URL:', publicUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the URL above');
    console.log('2. In Render dashboard, add environment variable:');
    console.log(`   VITE_VIDEO_URL=${publicUrl}`);
    console.log('3. Redeploy your frontend service');
    console.log('\n💡 Or set it locally in your .env file:');
    console.log(`   VITE_VIDEO_URL=${publicUrl}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error uploading video:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    
    if (error.code === 404 || (error.response && error.response.data && error.response.data.error && error.response.data.error.code === 404)) {
      console.error('\n💡 The storage bucket does not exist!');
      console.error(`   Bucket name: ${storageBucket}`);
      console.error('\n   📋 To create the bucket:');
      console.error('   1. Go to https://console.firebase.google.com/');
      console.error(`   2. Select project: ${serviceAccount.project_id}`);
      console.error('   3. Click "Storage" in the left menu');
      console.error('   4. Click "Get Started" (if not already set up)');
      console.error('   5. Choose your storage location (e.g., us-central1)');
      console.error('   6. Accept the default security rules');
      console.error('   7. Wait for the bucket to be created');
      console.error('\n   Then run this script again!');
    } else if (error.message.includes('Invalid URL') || error.code === 'ENOTFOUND') {
      console.error('\n💡 Possible issues:');
      console.error('   1. Storage bucket might not be initialized in Firebase');
      console.error('   2. Check Firebase Console → Storage to ensure it exists');
      console.error(`   3. Bucket name: ${storageBucket}`);
    }
    process.exit(1);
  }
}

uploadVideo();

