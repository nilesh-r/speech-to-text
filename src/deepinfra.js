import { AutomaticSpeechRecognition } from "deepinfra";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import { FileUpload } from "../model/fileUpload.js";

const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
const MODEL = "openai/whisper-large-v3";

export async function AudiofielUpload(req, res) {
    try {
        const { filename } = req.body;
        const file = req.file;
        const name = req.file.filename;
        const fileSizeInBytes = req.file.size;

        let fileSize;
        if (fileSizeInBytes >= 1024 * 1024 * 1024) {
            fileSize = (fileSizeInBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        } else if (fileSizeInBytes >= 1024 * 1024) {
            fileSize = (fileSizeInBytes / (1024 * 1024)).toFixed(2) + " MB";
        } else if (fileSizeInBytes >= 1024) {
            fileSize = (fileSizeInBytes / 1024).toFixed(2) + " KB";
        } else {
            fileSize = fileSizeInBytes + " Bytes";
        }

        // Save the uploaded file details in the database
        const response = await FileUpload.create({
            filename,
            originalName: name,
            mimetype: file.mimetype,
            size: fileSize.toString(),
            // buffer: file.buffer
        });

        if (!response) {
            return res.status(400).json({ msg: "file not uploaded" });
        }

        // Save the uploaded file temporarily for processing
        const audioFilePath = path.join(__dirname, '..', 'uploads', file.filename); // Path to the saved file in 'uploads' folder
        fs.writeFileSync(audioFilePath, file.buffer); // Save the file temporarily

        // Check if the file exists before proceeding
        if (!fs.existsSync(audioFilePath)) {
            console.log("File not found:", audioFilePath);
            return res.status(400).json({ msg: "Uploaded file not found." });
        }

        // Prepare form data to send to DeepInfra API
        const form = new FormData();
        form.append('audio', fs.createReadStream(audioFilePath));  // Append file as a stream

        // DeepInfra Speech-to-Text (Send form data)
        const client = new AutomaticSpeechRecognition(MODEL, DEEPINFRA_API_KEY);
        
        // Passing form data to DeepInfra API
        const recognitionResponse = await client.generate({
            data: form,  // DeepInfra expects the form data here
        });

        // Clean up the temporary file after processing
        fs.unlinkSync(audioFilePath);

        // Return the speech-to-text result along with the file upload response
        return res.status(200).json({
            msg: "file uploaded successfully",
            transcript: recognitionResponse.text,
        });
    } catch (error) {
        console.log("file not uploaded catch block", error);
        return res.status(500).json({ msg: "error in file upload" });
    }
}