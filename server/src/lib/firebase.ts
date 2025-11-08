import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import logger from '../utils/logger';

// Initialize Firebase Admin SDK
const initializeFirebase = (): admin.app.App => {
  try {
    // If already initialized, reuse the existing app
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const useEmulators = process.env.FIREBASE_USE_EMULATORS === 'true';

    if (useEmulators) {
      // ------------------------------
      // 🔧 EMULATOR MODE (optional for local dev)
      // ------------------------------
      logger.info('🔧 Initializing Firebase with emulators');

      const app = admin.initializeApp({
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

      // Try environment variable first, fallback to file
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      let serviceAccount;

      if (serviceAccountJson) {
        logger.info('🔎 Using service account from environment variable');
        serviceAccount = JSON.parse(serviceAccountJson);
      } else if (serviceAccountPath) {
        const resolvedPath = resolve(serviceAccountPath);
        logger.info(`🔎 Using service account at: ${resolvedPath}`);
        serviceAccount = JSON.parse(readFileSync(resolvedPath, 'utf8'));
      } else {
        throw new Error('Either FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH is required for cloud Firebase');
      }

      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

      logger.info('☁️ Connected to Firebase cloud services');
    }

    logger.info('✅ Firebase Admin SDK initialized successfully');
    return admin.app();
  } catch (error) {
    logger.error('❌ Firebase Admin SDK initialization failed:', error);
    throw error;
  }
};

// Initialize Firebase
initializeFirebase();

// Export Firebase services using default app
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

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

  deleteField: () => admin.firestore.FieldValue.delete(),
};

// ------------------------------
// 🔍 Connection Health Check
// ------------------------------
export const connectFirebase = async () => {
  try {
    await db.collection('_health').doc('test').set({ timestamp: FirestoreHelpers.serverTimestamp() });
    logger.info('✅ Firestore connected successfully');

    // Only test Auth if not using emulators or if Auth emulator is available
    const useEmulators = process.env.FIREBASE_USE_EMULATORS === 'true';
    if (!useEmulators) {
      try {
        await auth.listUsers(1);
        logger.info('✅ Firebase Auth connected successfully');
      } catch (authError) {
        logger.warn('⚠️ Firebase Auth connection failed (non-critical for emulator mode):', authError);
      }
    } else {
      logger.info('🔧 Skipping Firebase Auth test in emulator mode');
    }

    return true;
  } catch (error) {
    logger.error('❌ Firebase connection failed:', error);
    throw error;
  }
};

export default { auth, db, storage, FirestoreHelpers };
