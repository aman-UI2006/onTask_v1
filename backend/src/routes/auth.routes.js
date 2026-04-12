// auth.routes.js
// Endpoints for user authentication and profile management.

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const roleCheck = require("../middleware/roleCheck");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = "247709129581-71f9rdp47vur1ggd3ugr4432oic7dik9.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/register
router.post("/register", verifyToken, async (req, res) => {
  try {
    const { name, role, skills, department } = req.body;
    const firebaseUid = req.user.uid;
    const email = req.user.email;

    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      return res.status(200).json({ message: "Already registered", user: existingUser });
    }

    const newUser = await User.create({
      firebaseUid,
      email,
      name,
      role: role || "employee",
      skills: skills || [],
      department: department || "",
    });

    return res.status(201).json({ message: "Registered successfully", user: newUser });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: req.user.uid,
        email: req.user.email || "",
        name: req.user.name || req.user.email || "New User",
        role: "employee",
        skills: [],
        department: "AI Operations",
      });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server profile error" });
  }
});

// GET /api/auth/employees
router.get("/employees", verifyToken, roleCheck("manager"), async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).lean();
    return res.status(200).json({ employees });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Google Login Handler Logic
const googleLoginHandler = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "No token provided" });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ $or: [{ email }, { firebaseUid: googleId }] });

    if (!user) {
      user = await User.create({
        firebaseUid: googleId,
        email,
        name,
        role: "employee",
        department: "AI Operations",
      });
    }

    return res.status(200).json({ user, token });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    return res.status(401).json({ message: "Invalid Google token" });
  }
};

// Mount at /google-login relative to the router
router.post("/google-login", googleLoginHandler);

module.exports = { router, googleLoginHandler };