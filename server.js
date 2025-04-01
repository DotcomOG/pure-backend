// server.js
// ------------------------------
// 🚀 AI SEO Analysis Server
// ------------------------------

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from 'url';

// ------------------------------
// 🔧 Init
// ------------------------------

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ------------------------------
// 🔐 Confirm OpenAI Key Loaded
// ------------------------------

console.log("🔑 OpenAI Key Loaded:", process.env.OPENAI_API_KEY?.slice(0, 10) + "...");

// ------------------------------
// 🚪 Middleware
// ------------------------------

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------
// 🧠 OpenAI Init
// ------------------------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------
// 🕸️ Crawler Utility Function
// ------------------------------

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
      console.warn(`⚠️ Failed to crawl ${currentUrl}:`, e.message);
    }
  }

  return pages;
}

// ------------------------------
// 📊 /friendly - Main Analysis Endpoint
// ------------------------------

app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing URL parameter");

  const url = /^https?:\/\//i.test(targetUrl) ? targetUrl : `http://${targetUrl}`;

  try {
    const pages = await crawlSite(url);
    const siteSummary = pages.slice(0, 5).map(p =>
      `Page: ${p.url}\nTitle: ${p.title}\nMeta: ${p.metaDesc}\nH1: ${p.h1}`
    ).join("\n\n");

    const prompt = `
You are an AI SEO consultant. Analyze the following site and return a JSON report in this format:

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

Use the sample pages below:\n\n${siteSummary}
`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const raw = chatResponse.choices?.[0]?.message?.content || '{}';
    const data = JSON.parse(raw);
    res.json(data);

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
});

// ------------------------------
// 🏠 Root Route
// ------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// ------------------------------
// 🚀 Start Server
// ------------------------------

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
