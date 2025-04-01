// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- CRAWLER UTILITY ---
async function crawlSite(startUrl, maxPages = 100) {
  const visited = new Set();
  const queue = [startUrl];
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const res = await fetch(currentUrl);
      const html = await res.text();
      const $ = load(html);

      const title = $('title').text().trim();
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const h1 = $('h1').first().text().trim();
      const links = [];

      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        try {
          const absolute = new URL(href, currentUrl).href;
          if (
            absolute.startsWith(startUrl) &&
            !visited.has(absolute) &&
            absolute.startsWith('http')
          ) {
            links.push(absolute);
          }
        } catch (e) {}
      });

      pages.push({ url: currentUrl, title, metaDesc, h1 });
      queue.push(...links.filter(l => !visited.has(l)));
    } catch (e) {
      console.warn(`Failed to crawl ${currentUrl}:`, e.message);
    }
  }

  return pages;
}

// --- FRIENDLY ENDPOINT ---
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing URL parameter");
  }

  const url = /^https?:\/\//i.test(targetUrl) ? targetUrl : `http://${targetUrl}`;

  try {
    const pages = await crawlSite(url);

    // Create prompt for OpenAI to return structured JSON
    const siteSummary = pages.slice(0, 5).map(p =>
      `Page: ${p.url}\nTitle: ${p.title}\nMeta: ${p.metaDesc}\nH1: ${p.h1}`
    ).join("\n\n");

    const prompt = `
You are an AI SEO consultant generating a structured JSON report.
Analyze this website from an AI SEO perspective. Use the following format:

{
  "url": "...",
  "score": 0-100,
  "ai_superpowers": [{ "title": "...", "explanation": "..." }],
  "ai_opportunities": [{ "title": "...", "explanation": "..." }],
  "ai_engine_insights": {
    "ChatGPT": "...",
    "Claude": "...",
    "Google Gemini": "...",
    "Microsoft Copilot": "...",
    "Jasper AI": "..."
  }
}

Focus on AI SEO signals. Here are some page samples:\n\n${siteSummary}
`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const output = chatResponse.choices?.[0]?.message?.content || '{}';
    const json = JSON.parse(output);
    res.json(json);

  } catch (err) {
    console.error('Error during crawl or AI analysis:', err.message);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
});

// --- STATIC ROUTES ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
