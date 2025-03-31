import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the __dirname for debugging
console.log("Server __dirname:", __dirname);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure OpenAI client (for v4, the default import gives you a client instance)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Route for summary analysis (example endpoint)
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Please provide a ?url= parameter');
  }
  const url = targetUrl.trim().startsWith('http') ? targetUrl.trim() : 'https://' + targetUrl.trim();
  
  try {
    // Fetch the target page content
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)' },
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch. HTTP status: ${response.status}`);
    }
    const html = await response.text();
    const $ = load(html);
    const title = $('title').text().trim();
    
    // (Insert your analysis logic here, e.g., using cheerio to extract SEO metrics)
    const analysis = `Analyzed content from ${url}. Title found: "${title}"`;
    
    // Generate a dynamic summary using OpenAI's chat completions
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful AI SEO analysis assistant." },
        { role: "user", content: `Please generate a short SEO analysis summary for the following content: ${analysis}` }
      ],
      max_tokens: 100
    });
    
    const summary = chatResponse.choices[0].message.content;
    res.send(`<html><body><h1>SEO Summary for ${url}</h1><p>${summary}</p></body></html>`);
  } catch (error) {
    console.error("Error generating AI SEO analysis:", error);
    res.status(500).send("Error generating detailed AI SEO analysis.");
  }
});

// Route for serving the input page
app.get('/input.html', (req, res) => {
  const inputFile = path.join(__dirname, 'public', 'input.html');
  res.sendFile(inputFile, (err) => {
    if (err) {
      console.error("Error sending input.html:", err);
      res.status(500).send("Error loading input page.");
    }
  });
});

// Default route (serves main.html)
app.get('/', (req, res) => {
  const mainFile = path.join(__dirname, 'public', 'main.html');
  res.sendFile(mainFile, (err) => {
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