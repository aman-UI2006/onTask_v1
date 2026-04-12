// requireAuth.js
// Lighter than roleCheck — just confirms user exists in MongoDB.
// Use this on routes that BOTH managers and employees can access.
// roleCheck is for routes restricted to ONE specific role only.

const User = require("../models/User");

const requireAuth = async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Attach full MongoDB user doc — controllers use req.dbUser to check role
        req.dbUser = user;
        next();
    } catch (error) {
        console.error("requireAuth error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = requireAuth;