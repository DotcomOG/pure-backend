import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai'; // Ensure openai v4+ is installed
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for inquiries (for demonstration)
const inquiries = [];

/**
 * Normalize the URL. If the URL does not start with "http://" or "https://",
 * prepend "https://".
 */
function normalizeUrl(url) {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^www\./i, '');
    return "https://" + trimmed;
  }
  return trimmed;
}

/**
 * Analyze HTML using Cheerio to extract some basic SEO metrics.
 */
function analyzeHtml(html) {
  const $ = load(html);
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || "";
  const canonical = $('link[rel="canonical"]').attr('href') || "";
  const h1 = $('h1').first().text().trim();
  const images = $('img');
  let imagesWithoutAlt = 0;
  images.each((i, el) => {
    if (!$(el).attr('alt')) {
      imagesWithoutAlt++;
    }
  });
  return {
    title,
    titleLength: title.length,
    metaDesc: metaDesc.trim(),
    metaDescLength: metaDesc.trim().length,
    canonical: canonical.trim(),
    hasH1: h1.length > 0,
    totalImages: images.length,
    imagesWithoutAlt
  };
}

/**
 * Generate a dynamic AI SEO analysis report by calling the OpenAI API.
 * The prompt includes the URL and extracted metrics.
 */
async function generateDynamicAnalysis(url, html) {
  const metrics = analyzeHtml(html);
  const prompt = `
You are an expert in AI SEO. Analyze the following website information and provide an impressive, detailed report that highlights at least 20 improvement opportunities tailored for advanced AI SEO. Your analysis must include actionable feedback for AI engines such as ChatGPT, Claude (Anthropic), Google Gemini, Microsoft Copilot, and Jasper AI. Use whimsical, engaging language and ensure each opportunity is explained in 2 to 5 lines.
  
Website URL: ${url}

Extracted Metrics:
- Title: "${metrics.title}" (length: ${metrics.titleLength})
- Meta Description: "${metrics.metaDesc}" (length: ${metrics.metaDescLength})
- Canonical URL: "${metrics.canonical}"
- H1 present: ${metrics.hasH1 ? "Yes" : "No"}
- Total Images: ${metrics.totalImages}
- Images missing alt text: ${metrics.imagesWithoutAlt}

Based on these metrics, provide a comprehensive AI SEO report with deep insights and creative recommendations.
`;
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful AI SEO analysis assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating GPT analysis:", error);
    return "Error generating detailed AI SEO analysis.";
  }
}

/**
 * GET /friendly?url=<site>
 * Fetches the target URL, extracts HTML metrics, generates a dynamic AI SEO report via ChatGPT,
 * and returns an HTML page displaying the report.
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Please provide a ?url= parameter");
  
  const url = normalizeUrl(targetUrl);
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)' },
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    
    const html = await response.text();
    const dynamicAnalysis = await generateDynamicAnalysis(url, html);
    
    const resultHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Dynamic AI SEO Analysis for ${url}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            h1 { font-family: 'Forum', sans-serif; font-size: 1.8em; color: #333; }
            pre { white-space: pre-wrap; font-size: 0.95em; color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Dynamic AI SEO Analysis for ${url}</h1>
            <pre>${dynamicAnalysis}</pre>
          </div>
        </body>
      </html>
    `;
    
    res.send(resultHtml);
  } catch (error) {
    console.error("Error in /friendly route:", error);
    res.status(500).send("Error generating AI SEO analysis.");
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.send("OK");
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});