const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
require("dotenv").config();

const app = express();


app.use(cors({
    origin:"*"
})); // Enable CORS if needed
app.use(express.json());
console.log("online");
// Configure Multer storage
const storage = multer.diskStorage({
    destination: "./uploads/", // Folder where files will be stored
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });
app.get("/", async(req,res)=> {
    res.json("hii i'm live and i'm working for this project");
})
// API route for file upload
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ message: "File uploaded successfully", file: req.file });
});


app.post("/transcribe", upload.single("file"), async (req, res) => {
    try {
      console.log("🔹 Transcribe route hit!");
      console.log("🔹 Received file:", req.file);
      console.log("🔹 Received body:", req.body);
      console.log("🔹 API Key:", process.env.DEEPINFRA_API_KEY ? "Loaded" : "Missing");
  
      if (!req.file) {
        console.error("❌ No file uploaded!");
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
  
      console.log("✅ API Response:", response.data);
  
      // Delete uploaded file after processing
      fs.unlinkSync(audioPath);
  
      res.json(response.data);
    } catch (error) {
      console.error("❌ API Request Error:", error.response?.data || error.message);
      res.status(500).json({ error: error.response?.data || error.message });
    }
  });
// Start server
const PORT = process.env.PORT || 4000;
app.listen( PORT,() => {
    console.log(`Server is running on http://localhost:${PORT}`);

});