require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (_req, res) => res.send('OK'));

// Friendly endpoint
app.get('/friendly', async (req, res) => {
  try {
    const { url, type } = req.query;
    if (!url || !type) {
      return res.status(400).json({ error: 'Missing url or type parameter' });
    }

    // Fetch page HTML
    const fetch = require('node-fetch');
    const response = await fetch(url);
    const html = await response.text();

    // Call OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);

    const prompt =
      type === 'summary'
        ? `Summarize the SEO strengths and weaknesses of this HTML:\n\n${html}`
        : `Analyze the SEO strengths and weaknesses of this HTML in detail:\n\n${html}`;

    const aiRes = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800
    });

    const payload = JSON.parse(aiRes.data.choices[0].message.content);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: 'Failed to process URL', detail: err.message });
  }
});

// Serve front end
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));