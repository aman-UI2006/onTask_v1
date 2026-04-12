// server.js
// This is the entry point of our backend.
// It loads environment variables, connects to MongoDB,
// then starts the Express server on the given PORT.

require("dotenv").config(); // Load .env file first — always at the top
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// We connect to MongoDB first, then start server
// This way server never starts with a broken DB connection
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();