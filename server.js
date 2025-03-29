import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the __dirname for debugging
console.log("Server __dirname:", __dirname);

// Construct the path to main.html using lowercase "public"
const mainFile = path.join(__dirname, 'public', 'main.html');

// Check if main.html exists in the lowercase "public" folder
if (fs.existsSync(mainFile)) {
  console.log("Found main.html at:", mainFile);
} else {
  console.log("main.html NOT found at:", mainFile);
}

// Serve static files from the lowercase "public" folder
app.use(express.static(path.join(__dirname, 'public')));

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