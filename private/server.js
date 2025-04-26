// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { URL } = require('url');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.send('OK'));

// AI-SEO endpoint
app.get('/friendly', async (req, res) => {
  const { type, url } = req.query;
  if (!type || !url) {
    return res.status(400).json({ error: 'Missing type or url query parameter' });
  }

  let target;
  try {
    target = new URL(url).href;
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  console.log(`🔍 Fetching HTML for: ${target}`);
  try {
    const { data: html } = await axios.get(target);
    const prompt =
      type === 'summary'
        ? `Summarize the AI-SEO strengths and opportunities of this HTML:\n\n${html}`
        : `Provide a detailed AI-SEO report (superpowers & opportunities) for this HTML:\n\n${html}`;

    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });

    const out = aiRes.choices[0].message.content;
    return res.json(JSON.parse(out));
  } catch (err) {
    console.error('❌ /friendly error:', err);
    return res
      .status(500)
      .json({ error: 'Failed to process URL', detail: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));