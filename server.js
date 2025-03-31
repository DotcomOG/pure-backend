import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("Server __dirname:", __dirname);

// Define the public folder path
const publicPath = path.join(__dirname, 'public');
console.log("Serving static files from:", publicPath);

// Serve static files from the public folder
app.use(express.static(publicPath));

// Route for the main page (if needed)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'main.html'), (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// Explicit route for input.html (if needed)
app.get('/input.html', (req, res) => {
  res.sendFile(path.join(publicPath, 'input.html'), (err) => {
    if (err) {
      console.error("Error sending input.html:", err);
      res.status(500).send("Error loading input page.");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});