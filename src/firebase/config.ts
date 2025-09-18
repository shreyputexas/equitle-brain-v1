import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB9uCbqk4J6M9fXASsgHI2FwUDxqndbyzE",
  authDomain: "equitle.firebaseapp.com",
  projectId: "equitle",
  storageBucket: "equitle.firebasestorage.app",
  messagingSenderId: "621123805303",
  appId: "1:621123805303:web:1681b2af10f6d7a5676672",
  measurementId: "G-DB8G3TY5SY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Add this line to export auth
export const auth = getAuth(app);
