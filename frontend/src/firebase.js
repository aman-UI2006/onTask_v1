// firebase.js
// Initializes Firebase on the FRONTEND (client side).
// This is different from backend/firebase-admin.js —
// that one is for the server, this one is for the browser.
// After login, Firebase gives us an ID token we send to the backend.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These values come from Firebase Console → Project Settings → Your Apps
// They are SAFE to expose in frontend code — they identify your project
// but cannot be used to do anything without valid credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// auth is what we use to login, logout, register
export const auth = getAuth(app);
export default app;
