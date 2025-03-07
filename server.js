const express = require("express");
const multer = require("multer");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log all registered routes
app._router?.stack.forEach((route) => {
  if (route.route && route.route.path) {
    console.log("Registered route:", route.route.path);
  }
});

// Test route (to check if POST requests work on Render)
app.post("/test", (req, res) => {
  res.json({ message: "Test route is working!" });
});

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
    cb(null, true);
  },
});

// Main transcribe route


// Error handling middleware for Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("❌ Multer error:", err);
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Start the server
app.listen(port,"0.0.0.0", () => {
  console.log(` Server running on http://localhost:${port}`);
});
