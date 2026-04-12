// verifyToken.js
// This middleware runs BEFORE any protected route handler.
// Supports both Firebase tokens and Google GSI tokens.

const admin = require("../config/firebase-admin");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = "247709129581-71f9rdp47vur1ggd3ugr4432oic7dik9.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ message: "Invalid or missing token" });
    }

    // Attempt Firebase verification first
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (firebaseError) {
      // If Firebase fails, try Google OAuth verification
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        // Construct a user object that mimics the structure used by Firebase decoded token
        req.user = {
          uid: payload['sub'], // Google unique ID
          email: payload['email'],
          name: payload['name'],
          picture: payload['picture'],
          auth_origin: "google-oauth"
        };
        return next();
      } catch (googleError) {
        console.error("❌ Dual verification failed:", {
          firebase: firebaseError.message,
          google: googleError.message
        });
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    }
  } catch (error) {
    console.error("❌ Token verification critical failure:", error.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = verifyToken;