import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8080;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log __dirname for debugging
console.log("Server __dirname:", __dirname);

// Define the path to main.html inside your public folder
const mainFile = path.join(__dirname, 'public', 'main.html');

// Check if main.html exists
if (fs.existsSync(mainFile)) {
  console.log("Found main.html at:", mainFile);
} else {
  console.log("main.html NOT found at:", mainFile);
}

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Root route: serve main.html
app.get('/', (req, res) => {
  res.sendFile(mainFile, (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// /friendly route: receives a URL query parameter and fetches that page.
// (This is a placeholder for your dynamic analysis logic.)
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Please provide a ?url= parameter');
  }
  
  // Normalize URL: add "https://" if missing
  let normalizedUrl = targetUrl;
  if (!/^https?:\/\//i.test(targetUrl)) {
    normalizedUrl = "https://" + targetUrl;
  }
  
  try {
    const response = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'AI-SEO-Tool/1.0' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const html = await response.text();
    
    // For now, just send a simple placeholder response.
    res.send(`
      <h1>AI SEO Analysis for ${normalizedUrl}</h1>
      <p>This is a placeholder for the dynamic analysis.</p>
      <div style="border: 1px solid #ccc; padding: 10px; margin-top: 20px;">
        Fetched HTML content (truncated):<br>
        ${html.substring(0, 500)}...
      </div>
    `);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send("Error retrieving content from the provided URL.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});