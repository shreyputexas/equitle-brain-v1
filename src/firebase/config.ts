import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDuJtDrZHzQAW-M8rbkVPl8oTalxU1f6ko",
  authDomain: "equitle-brain-dev.firebaseapp.com",
  projectId: "equitle-brain-dev",
  storageBucket: "equitle-brain-dev.firebasestorage.app",
  messagingSenderId: "44990905496",
  appId: "1:44990905496:web:f6cfc91b23549793cc64ed",
  measurementId: "G-6GZHY4SQB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Only initialize analytics in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

