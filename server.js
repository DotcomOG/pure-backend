require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (_req, res) => res.send('OK'));

// AI‐SEO endpoint
app.get('/friendly', async (req, res) => {
  const { type, url } = req.query;
  if (!type || !url) {
    return res.status(400).json({ error: 'Missing type or url parameter' });
  }
  try {
    console.log(`🔍 Fetching: ${url}`);
    const { data: html } = await axios.get(url);
    console.log(`✅ HTML fetched (${html.length} chars)`);

    const prompt = type === 'summary'
      ? `Summarize the SEO strengths and weaknesses of this HTML:\n${html}`
      : `Provide a full SEO analysis (strengths & weaknesses) of this HTML:\n${html}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    let json;
    try {
      json = JSON.parse(content);
    } catch {
      return res.status(500).json({ error: 'Invalid JSON from AI', detail: content });
    }

    res.json(json);
  } catch (err) {
    console.error('❌ /friendly error:', err);
    res.status(500).json({ error: 'Failed to process URL', detail: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));