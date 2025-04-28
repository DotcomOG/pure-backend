// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(express.static('public'));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// health check
app.get('/health', (_req, res) => res.send('OK'));

// main endpoint
app.get('/friendly', async (req, res) => {
  const { url, type } = req.query;
  if (!url || !type) {
    return res.status(400).json({ error: 'Missing url or type' });
  }

  try {
    // fetch raw HTML
    const { data: html } = await axios.get(url);
    // strip scripts/styles
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // truncate to ~12k chars (model limit ~16k tokens ≈ 32k chars)
    if (text.length > 12000) {
      text = text.slice(0, 12000) + '…';
    }

    const systemPrompt = `You are an AI SEO auditor. Return a JSON with keys: score (0–100), ai_superpowers (object), ai_opportunities (object).`;
    const userPrompt = `Analyze this HTML text for SEO (mode=${type}):\n\n${text}`;

    const chat = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const reply = chat.data.choices[0].message.content;
    const output = JSON.parse(reply);
    res.json(output);

  } catch (err) {
    // context-length or JSON errors
    const msg = err.response?.data?.error?.message || err.message;
    return res.status(500).json({
      error: 'Failed to process URL',
      detail: msg.includes('maximum context length')
        ? 'Page too large; try a smaller page or a shorter URL'
        : msg
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));