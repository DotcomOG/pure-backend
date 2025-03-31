import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Server __dirname:", __dirname);

// Serve static files from the "public" folder
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

// Initialize OpenAI client using default import
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

// /friendly endpoint: performs dynamic AI SEO analysis using ChatGPT
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Please provide a 'url' query parameter.");
  }
  
  // Create a prompt for dynamic analysis
  const prompt = `Analyze the following website for AI SEO strengths and opportunities for improvement: ${targetUrl}. 
Provide your analysis in bullet points. Reference AI engines such as ChatGPT, Claude, Google Gemini, Microsoft Copilot, and Jasper AI. 
The response should be impressive and detailed (each bullet 2-5 lines), using the term "AI SEO" throughout.`;

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 600,
    });
    const analysis = completion.data.choices[0].text.trim();
    res.send(`
      <h1>Dynamic AI SEO Analysis for ${targetUrl}</h1>
      <div>${analysis}</div>
    `);
  } catch (error) {
    console.error("Error generating AI SEO analysis:", error);
    res.status(500).send("Error generating detailed AI SEO analysis.");
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});