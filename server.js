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

// Serve static files from the 'public' folder
const publicDir = path.join(__dirname, 'public');
console.log("Serving static files from:", publicDir);
app.use(express.static(publicDir));

// Root route: serve main.html from the public folder
app.get('/', (req, res) => {
  const mainFile = path.join(publicDir, 'main.html');
  res.sendFile(mainFile, (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// Dynamic /friendly endpoint: placeholder for dynamic analysis
app.get('/friendly', (req, res) => {
  // This is where you would integrate dynamic analysis logic (e.g., with ChatGPT)
  res.send("Placeholder for dynamic analysis");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});