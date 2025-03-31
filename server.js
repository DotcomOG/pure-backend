// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAI from 'openai'; // Ensure openai v4+ is installed

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log __dirname for debugging
console.log("Server __dirname:", __dirname);

// Serve static files from the "public" folder
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Example: Define the root route to serve the main page (main.html)
app.get('/', (req, res) => {
  const mainFile = path.join(publicDir, 'main.html');
  res.sendFile(mainFile, (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// You can add additional routes (for dynamic endpoints like /friendly or /detailed) below
// For example:
// app.get('/friendly', async (req, res) => { ... });

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});