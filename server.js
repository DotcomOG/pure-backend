import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the __dirname for debugging
console.log("Server __dirname:", __dirname);

// Define the public directory and log it
const publicDir = path.join(__dirname, 'public');
console.log("Serving static files from:", publicDir);

// Serve static files from the 'public' folder
app.use(express.static(publicDir));

// Parse incoming JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize OpenAI with the API key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Route to serve the input page (e.g., for URL submission)
app.get('/input.html', (req, res) => {
  res.sendFile(path.join(publicDir, 'input.html'), (err) => {
    if (err) {
      console.error("Error sending input.html:", err);
      res.status(500).send("Error loading input page.");
    }
  });
});

// Example route: /friendly?url=<site>
// This route returns a dynamic analysis generated using OpenAI's chat completions API
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Please provide a ?url= parameter');
  }
  
  const prompt = `Analyze the following website URL for AI SEO opportunities and provide a detailed analysis: ${targetUrl}`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert in AI SEO analysis." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    const analysis = completion.choices[0].message.content;
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>AI SEO Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            h1 { font-family: 'Forum', sans-serif; font-size: 1.8em; color: #333; }
            p { font-size: 1em; color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Dynamic AI SEO Analysis for ${targetUrl}</h1>
            <p>${analysis}</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error generating detailed AI SEO analysis:", error);
    // Return error details in JSON for debugging (remove in production)
    res.status(500).json({ error: error.message });
  }
});

// Define the root route to serve main.html from the public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'main.html'), (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading main page.");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});