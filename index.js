const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors()); // Enable CORS if needed
app.use(express.json());
console.log("online ten");
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

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});