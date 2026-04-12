// firebase-admin.js
// Initializes Firebase Admin SDK using the service account key file.
// This is the SERVER-SIDE Firebase — different from the frontend Firebase.
// It lets our backend verify Firebase login tokens sent by the frontend.

const admin = require("firebase-admin");

// We support 2 ways to provide credentials:
// 1) Local file: ../../serviceAccountKey.json (optional, not committed)
// 2) Env var: FIREBASE_SERVICE_ACCOUNT_JSON (recommended for deployment)
//    - Must be valid JSON on a single line
//    - If it's hard to paste JSON into .env, you can use FIREBASE_SERVICE_ACCOUNT_JSON_B64 instead
let serviceAccount = null;

try {
  // Try loading from local file
  serviceAccount = require("../../serviceAccountKey.json");
  console.log("✅ Firebase Admin: Loaded credentials from serviceAccountKey.json");
} catch (e) {
  // Fallback to env vars
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log("✅ Firebase Admin: Loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON");
    } catch (err) {
      console.error("❌ Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }
}

// Only initialize once
if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Last-resort fallback for GCP environments
    const projectId = process.env.FIREBASE_PROJECT_ID;
    console.warn(`⚠️  Firebase Admin: No service account key found. Falling back to Application Default for project: ${projectId}`);
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId,
    });
  }
}

module.exports = admin;