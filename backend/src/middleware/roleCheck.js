// roleCheck.js
// Used after verifyToken to restrict routes by role.
// Example: only managers can create projects.
// Usage in routes: router.post("/", verifyToken, roleCheck("manager"), controller)

const User = require("../models/User");

const roleCheck = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Find user in MongoDB using Firebase UID from verified token
      const user = await User.findOne({ firebaseUid: req.user.uid });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({
          message: `Access denied. Only ${requiredRole}s allowed.`,
        });
      }

      // Attach full MongoDB user to request for use in controllers
      req.dbUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error.message);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = roleCheck;