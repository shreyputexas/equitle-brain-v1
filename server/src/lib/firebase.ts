import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import logger from '../utils/logger';

// Initialize Firebase Admin SDK
let app: admin.app.App | undefined;

const initializeFirebase = (): admin.app.App => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      app = admin.apps[0] as admin.app.App;
      return app;
    }

    // Initialize with service account (for production) or project ID (for emulator)
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required in production');
      }

      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Development mode - use project ID for emulators
      app = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'equitle-brain-dev',
      });
      
      // Set emulator hosts for development
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
    }

    logger.info('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    logger.error('❌ Firebase Admin SDK initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase
app = initializeFirebase();

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper functions for Firestore operations
export const FirestoreHelpers = {
  // Get user's collection reference
  getUserCollection: (userId: string, collection: string) => {
    return db.collection('users').doc(userId).collection(collection);
  },

  // Get user document reference
  getUserDoc: (userId: string) => {
    return db.collection('users').doc(userId);
  },

  // Get user's document in a subcollection
  getUserDocInCollection: (userId: string, collection: string, docId: string) => {
    return db.collection('users').doc(userId).collection(collection).doc(docId);
  },

  // Batch operations
  batch: () => db.batch(),

  // Server timestamp
  serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),

  // Array operations
  arrayUnion: (...elements: any[]) => admin.firestore.FieldValue.arrayUnion(...elements),
  arrayRemove: (...elements: any[]) => admin.firestore.FieldValue.arrayRemove(...elements),

  // Increment
  increment: (value: number) => admin.firestore.FieldValue.increment(value),
};

// Connection helper
export const connectFirebase = async () => {
  try {
    // Test Firestore connection
    await db.collection('_health').doc('test').set({ timestamp: FirestoreHelpers.serverTimestamp() });
    logger.info('✅ Firestore connected successfully');

    // Test Auth connection
    await auth.listUsers(1);
    logger.info('✅ Firebase Auth connected successfully');

    return true;
  } catch (error) {
    logger.error('❌ Firebase connection failed:', error);
    throw error;
  }
};

export default { auth, db, storage, FirestoreHelpers };