// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get('/health', (_req, res) => res.send('OK'));

app.get('/friendly', async (req, res) => {
  const { type, url } = req.query;
  if (!type || !url) {
    return res.status(400).json({ error: 'Missing type or url' });
  }

  try {
    const { data: html } = await axios.get(url);
    // your existing parsing & prompt logic here...
    const prompt = `Analyze this HTML for AI-SEO ${type}: ${html}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (err) {
    res.status(500).json({ error: 'Failed to process URL', detail: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));