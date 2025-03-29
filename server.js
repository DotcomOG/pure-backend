import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the __dirname so we can verify the folder structure on Railway
console.log("Server __dirname:", __dirname);

// Construct the path to main.html
const mainFile = path.join(__dirname, 'Public', 'main.html');

// Check if main.html exists
if (fs.existsSync(mainFile)) {
  console.log("Found main.html at:", mainFile);
} else {
  console.log("main.html NOT found at:", mainFile);
}

// Serve static files from the Public folder
app.use(express.static(path.join(__dirname, 'Public')));

// Define the root route to serve main.html explicitly
app.get('/', (req, res) => {
  res.sendFile(mainFile, (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});