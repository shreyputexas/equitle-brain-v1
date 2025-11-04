import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const app = initializeApp();

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);