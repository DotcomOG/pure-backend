const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI API setup (make sure .env has your OPENAI_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Serve static files correctly from the public folder (including admin folder)
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint for friendly SEO analysis
app.get('/friendly', async (req, res) => {
  const { url, detail } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  const prompt = detail === 'full'
    ? `Perform a detailed AI SEO analysis for ${url} and provide:
      - At least 5 specific SEO strengths clearly labeled "AI Superpowers".
      - At least 10 actionable AI-driven SEO recommendations labeled "SEO Opportunities".
      - At least 7 detailed technical insights under "AI Engine Insights".
      Clearly structure the response as a JSON with properties:
      {
        "ai_superpowers": [{"title":"...","explanation":"..."}],
        "ai_opportunities": [{"title":"...","explanation":"..."}],
        "ai_engine_insights": {"insight title":"insight explanation"}
      }`
    : `Perform a brief AI SEO summary analysis for ${url}. Provide:
      - 3 "AI Superpowers".
      - 3 "SEO Opportunities".
      - 3 "AI Engine Insights".
      Respond clearly structured as a JSON with:
      {
        "score": (0-100 SEO score),
        "ai_superpowers":[{"title":"...","explanation":"..."}],
        "ai_opportunities":[{"title":"...","explanation":"..."}],
        "ai_engine_insights":{"insight title":"insight explanation"}
      }`;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const responseData = JSON.parse(aiResponse.choices[0].message.content);
    res.json(responseData);
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'OpenAI API call failed', details: err.message });
  }
});

// Catch-all route to serve index.html (for direct URL entry support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server correctly (Railway and local)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running correctly on port ${PORT}`);
});