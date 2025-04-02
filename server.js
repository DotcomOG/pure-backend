const express = require('express');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const cache = {};  // Simple in-memory cache

app.get('/friendly', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required." });
  }

  // Return cached response if available
  if (cache[url]) {
    return res.json(cache[url]);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `
          You are an AI-powered SEO analyst. Crawl and analyze the provided URL deeply.
          Generate a unique SEO analysis including:
          - Score (0-100)
          - 1 to 5 strengths ("ai_superpowers") with titles and detailed explanations.
          - 1 to 10 weaknesses ("ai_opportunities") with titles and detailed explanations.
          - AI Engine Insights (ChatGPT, Claude, Gemini, Copilot, Jasper), clearly detailed and actionable (2-5 lines each).
          Provide response strictly in this JSON format without any additional text:
          {
            "url": "provided-url",
            "score": numeric-value,
            "ai_superpowers": [{title, explanation}],
            "ai_opportunities": [{title, explanation}],
            "ai_engine_insights": {"EngineName": "Insight"}
          }`
        },
        {
          role: 'user',
          content: `Analyze the following website for SEO opportunities and strengths: ${url}`
        }
      ],
      temperature: 0.5,  // Reduced temperature for faster responses
      max_tokens: 800,   // Reduced tokens for quicker responses
      response_format: { type: "json_object" }
    });

    const jsonResponse = JSON.parse(completion.choices[0].message.content);

    // Cache the response
    cache[url] = jsonResponse;

    res.json(jsonResponse);
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate dynamic report' });
  }
});

app.listen(port, () => {
  console.log(`Dynamic AI SEO backend running quickly on port ${port}`);
});