import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

// Initialize Firebase Admin with service account credentials
// Try multiple possible paths for the service account file
const possiblePaths = [
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
  path.join(process.cwd(), 'equitle-brain-dev-firebase-adminsdk-fbsvc-f95ee42ed1.json'),
  path.join(process.cwd(), 'firebase-service-account.json'),
  path.join(__dirname, '../../../equitle-brain-dev-firebase-adminsdk-fbsvc-f95ee42ed1.json'),
];

let app;
let initialized = false;

for (const serviceAccountPath of possiblePaths) {
  if (!serviceAccountPath) continue;
  
  try {
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'equitle-brain-dev',
    });
    initialized = true;
    break;
  } catch (error) {
    // Try next path
    continue;
  }
}

// Fallback to default initialization if no service account found
if (!initialized) {
  app = initializeApp({
    projectId: 'equitle-brain-dev',
  });
}

// Initialize services
if (!app) {
  throw new Error('Failed to initialize Firebase app');
}

export const db = getFirestore(app);
export const auth = getAuth(app);