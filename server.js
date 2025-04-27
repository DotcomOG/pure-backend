// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Health check
app.get('/health', (_req, res) => res.send('OK'));

// /friendly endpoint
app.get('/friendly', async (req, res) => {
  const { type, url } = req.query;
  if (!type || !['summary','full'].includes(type) || !url) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    const { data: html } = await axios.get(url);
    const prompt = `Generate an AI-SEO ${type} report for this page:\n\n${html}`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    // Expect the model to return valid JSON
    const result = JSON.parse(completion.data.choices[0].message.content);
    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process URL', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));