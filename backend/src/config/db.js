// db.js
// Handles MongoDB connection using Mongoose.
// If connection fails, we stop the server immediately (process.exit)
// because running without a database would cause all routes to crash.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Stop everything — no DB = no app
  }
};

module.exports = connectDB;