// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize OpenAI (v4+)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility: Normalize a URL (prepends "http://" if missing)
function normalizeUrl(url) {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "http://" + trimmed;
  }
  return trimmed;
}

// /friendly endpoint: generates dynamic AI SEO analysis using OpenAI
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing URL parameter");
  }
  const url = normalizeUrl(targetUrl);
  try {
    // Fetch the website content
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const html = await response.text();
    const $ = load(html);
    
    // Extract basic information from the page
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || "No meta description found";

    // Build a prompt for the dynamic analysis
    const prompt = `You are an AI SEO expert. Provide a detailed AI SEO analysis summary for the website: ${url}.
The site's title is "${title}" and its meta description is "${metaDesc}". 
Give actionable recommendations specific to AI SEO for engines such as ChatGPT, Claude, Google Gemini, Microsoft Copilot, and Jasper AI.
Use a professional tone with creative insights and a wow factor.`;

    // Request completion from OpenAI
    const aiResponse = await openai.completions.create({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 200,
      temperature: 0.7,
    });
    const analysis = aiResponse.data.choices[0].text.trim();

    res.send(analysis);
  } catch (error) {
    console.error("Error generating dynamic AI SEO analysis:", error);
    // Send the error message in the response for debugging (remove in production)
    res.status(500).send("Error generating dynamic AI SEO analysis: " + error.message);
  }
});

// Root route: serves main.html from the public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});