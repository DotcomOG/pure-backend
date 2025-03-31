import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("Server __dirname:", __dirname);

// Serve static files from the public folder (if any)
const publicFolder = path.join(__dirname, 'public');
app.use(express.static(publicFolder));

// Also serve static files from the project root
app.use(express.static(__dirname));

// Define root route: serve main.html from the public folder
const mainFile = path.join(publicFolder, 'main.html');
app.get('/', (req, res) => {
  if (fs.existsSync(mainFile)) {
    res.sendFile(mainFile, (err) => {
      if (err) {
        console.error("Error sending main.html:", err);
        res.status(500).send("Error loading page.");
      }
    });
  } else {
    res.status(404).send("main.html not found");
  }
});

// Explicit route for input.html in the project root
app.get('/input.html', (req, res) => {
  const inputFile = path.join(__dirname, 'input.html');
  console.log("Looking for input.html at:", inputFile);
  if (fs.existsSync(inputFile)) {
    res.sendFile(inputFile);
  } else {
    res.status(404).send("input.html not found");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});