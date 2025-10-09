import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import logger from '../utils/logger';

// Initialize Firebase Admin SDK
let app: admin.app.App | undefined;

const initializeFirebase = (): admin.app.App => {
  try {
    // If already initialized, reuse the existing app
    if (admin.apps.length > 0) {
      app = admin.apps[0];
      return app;
    }

    const useEmulators = process.env.FIREBASE_USE_EMULATORS === 'true';

    if (useEmulators) {
      // ------------------------------
      // 🔧 EMULATOR MODE (optional for local dev)
      // ------------------------------
      logger.info('🔧 Initializing Firebase with emulators');

      app = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'equitle-brain-dev',
      });

      process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';

      logger.info('🔧 Connected to Firebase emulators');
    } else {
      // ------------------------------
      // ☁️ CLOUD (REAL FIREBASE PROJECT)
      // ------------------------------
      logger.info('☁️ Initializing Firebase with cloud services');

      // Clear emulator envs to prevent fallback
      delete process.env.FIRESTORE_EMULATOR_HOST;
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;

      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (!serviceAccountPath) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is required for cloud Firebase');
      }

      const resolvedPath = resolve(serviceAccountPath);
      logger.info(`🔎 Using service account at: ${resolvedPath}`);

      const serviceAccount = JSON.parse(readFileSync(resolvedPath, 'utf8'));

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

      logger.info('☁️ Connected to Firebase cloud services');
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

// ------------------------------
// 🔧 Firestore Helper Utilities
// ------------------------------
export const FirestoreHelpers = {
  getUserCollection: (userId: string, collection: string) => {
    return db.collection('users').doc(userId).collection(collection);
  },

  getUserDoc: (userId: string) => {
    return db.collection('users').doc(userId);
  },

  getUserDocInCollection: (userId: string, collection: string, docId: string) => {
    return db.collection('users').doc(userId).collection(collection).doc(docId);
  },

  batch: () => db.batch(),

  serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),

  arrayUnion: (...elements: any[]) => admin.firestore.FieldValue.arrayUnion(...elements),
  arrayRemove: (...elements: any[]) => admin.firestore.FieldValue.arrayRemove(...elements),

  increment: (value: number) => admin.firestore.FieldValue.increment(value),
};

// ------------------------------
// 🔍 Connection Health Check
// ------------------------------
export const connectFirebase = async () => {
  try {
    await db.collection('_health').doc('test').set({ timestamp: FirestoreHelpers.serverTimestamp() });
    logger.info('✅ Firestore connected successfully');

    await auth.listUsers(1);
    logger.info('✅ Firebase Auth connected successfully');

    return true;
  } catch (error) {
    logger.error('❌ Firebase connection failed:', error);
    throw error;
  }
};

export default { auth, db, storage, FirestoreHelpers };
