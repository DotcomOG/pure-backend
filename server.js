import express from 'express';
import cors from 'cors';
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log the last 4 characters of the API key for debugging (do not log the full key)
const key = process.env.OPENAI_API_KEY;
if (key) {
  console.log("Using OpenAI API key ending in:", key.slice(-4));
} else {
  console.error("No OpenAI API key found in environment variables.");
}

// Initialize OpenAI client (ensure you have openai v4+ installed)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Detailed report endpoint using the ChatGPT API
app.post('/detailed', async (req, res) => {
  const { url, name, email, company } = req.body;
  if (!url || !name || !email) {
    return res.status(400).json({ error: "URL, Name, and Email are required." });
  }
  try {
    // Call the OpenAI chat completions API for a detailed analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI SEO expert. Provide a detailed analysis of the website with 20 to 50 opportunities for improvement. Your analysis must be AI SEO specific and mention insights for ChatGPT, Claude, Google Gemini, Microsoft Copilot, and Jasper AI. Each issue must have between 2 to 5 lines of detailed explanation."
        },
        {
          role: "user",
          content: `Analyze the website ${url} and generate a detailed AI SEO analysis report.`
        }
      ],
      temperature: 0.7,
    });
    const report = completion.choices[0].message.content;
    res.status(200).json({ report });
  } catch (error) {
    console.error("Error generating AI SEO analysis:", error);
    res.status(500).json({ error: "Error generating detailed AI SEO analysis." });
  }
});

// Summary report endpoint (for demonstration, returns a placeholder)
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Please provide a url parameter.");
  }
  // You would normally perform analysis here using Cheerio etc.
  res.send("Placeholder for dynamic AI SEO analysis summary.");
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route to serve the input page (input.html should be in the public folder)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'input.html'));
});

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});