const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    console.log("Received file:", req.file);
    console.log("Received body:", req.body);
    console.log("API Key:", process.env.DEEPINFRA_API_KEY ? "Loaded" : "Missing");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audioPath = path.join(__dirname, "uploads", req.file.filename);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioPath));
    formData.append("model", "openai/whisper-large-v3");

    const response = await axios.post(
      "https://api.deepinfra.com/v1/openai/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    console.log("API Response:", response.data);
    
    // Delete uploaded file after processing
    fs.unlinkSync(audioPath);

    res.json(response.data);
  } catch (error) {
    console.error("API Request Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Error handling middleware for Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});