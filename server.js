const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');  // Import CORS

const app = express();
const UPLOAD_FOLDER = path.join(__dirname, 'uploads');

// Middleware to parse JSON
app.use(bodyParser.json({ limit: '50mb' }));

// Enable CORS for all origins (you can customize this for specific origins)
app.use(cors());

// Ensure uploads folder exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

// POST endpoint to receive base64 data and save as a file
app.post('/upload', (req, res) => {
    try {
        const { file_data, file_name } = req.body;

        if (!file_data || !file_name) {
            return res.status(400).json({ error: "Missing file data or file name" });
        }

        // Decode base64 and save to file
        const fileBuffer = Buffer.from(file_data, 'base64');
        const filePath = path.join(UPLOAD_FOLDER, file_name);

        fs.writeFileSync(filePath, fileBuffer);

        // Get the protocol (http/https) and host dynamically
        const protocol = req.protocol;  // 'http' or 'https'
        const host = req.get('host');   // Get the host (e.g., 'your-hosted-url.com')

        // Generate the download URL automatically
        const downloadUrl = `${protocol}://${host}/download/${file_name}`;

        res.status(200).json({ 
            message: "File uploaded successfully", 
            download_url: downloadUrl 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET endpoint to download the file
app.get('/download/:file_name', (req, res) => {
    const { file_name } = req.params;
    const filePath = path.join(UPLOAD_FOLDER, file_name);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (!err) {
                // Delete the file after the download starts
                fs.unlinkSync(filePath);  // Delete the file from the upload folder
                console.log(`Deleted file: ${file_name}`);
            }
        });
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
