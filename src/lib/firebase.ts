import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'equitle-brain-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'equitle-brain-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'equitle-brain-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123def456',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators if enabled
const useEmulators = import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true';

if (useEmulators) {
  console.log('🔧 Connecting to Firebase emulators...');

  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false,
  };

  try {
    if (!isEmulatorConnected.auth) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      isEmulatorConnected.auth = true;
      console.log('🔧 Connected to Firebase Auth Emulator');
    }
  } catch (error) {
    console.warn('Firebase Auth Emulator connection failed:', error);
  }

  try {
    if (!isEmulatorConnected.firestore) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      isEmulatorConnected.firestore = true;
      console.log('🔧 Connected to Firestore Emulator');
    }
  } catch (error) {
    console.warn('Firestore Emulator connection failed:', error);
  }

  try {
    if (!isEmulatorConnected.storage) {
      connectStorageEmulator(storage, 'localhost', 9199);
      isEmulatorConnected.storage = true;
      console.log('🔧 Connected to Firebase Storage Emulator');
    }
  } catch (error) {
    console.warn('Firebase Storage Emulator connection failed:', error);
  }
} else {
  console.log('☁️ Using Firebase cloud services');
}

export default app;