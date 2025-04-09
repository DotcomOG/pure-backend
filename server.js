const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SEO analysis endpoint
app.get('/friendly', async (req, res) => {
  const { url, detail } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const prompt = detail === 'full'
    ? `You are an expert in AI-powered SEO optimization. Analyze the website: ${url}

Return a valid JSON object using this exact structure:
{
  "score": 0-100,
  "ai_superpowers": [
    { "title": "Short title", "explanation": "A detailed explanation of an AI SEO strength (2–5 lines)" },
    ...(minimum 10 items)
  ],
  "ai_opportunities": [
    { "title": "Short title", "explanation": "A detailed explanation of an AI SEO improvement opportunity (2–5 lines)" },
    ...(minimum 20 items)
  ],
  "ai_engine_insights": {
    "ChatGPT": "2–5 line explanation of how ChatGPT applies to this site's AI SEO",
    "Claude": "2–5 line explanation of Claude's relevance",
    "Google Gemini": "2–5 line explanation of Gemini's strengths",
    "Microsoft Copilot": "2–5 line explanation of Copilot's usage",
    "Jasper AI": "2–5 line explanation of Jasper's strengths"
  }
}

✅ Explanations must relate to how AI tools and models impact SEO
✅ Do not include generic SEO advice
✅ Return ONLY valid JSON — no markdown, backticks, or commentary.`
   : `You are an AI-powered SEO analyst. Briefly evaluate the website: ${url}

Return valid JSON with the following structure:

{
  "score": 0-100,
  "ai_superpowers": [
    { "title": "...", "explanation": "2–5 lines of AI SEO-focused detail" }
    ...(5 to 7 items total)
  ],
  "ai_opportunities": [
    { "title": "...", "explanation": "2–5 lines of AI SEO-focused detail" }
    ...(15 to 25 items total)
  ],
  "ai_engine_insights": {
    "ChatGPT": "2–3 line insight",
    "Claude": "2–3 line insight",
    "Google Gemini": "2–3 line insight",
    "Microsoft Copilot": "2–3 line insight",
    "Jasper AI": "2–3 line insight"
  }
}

✅ Do not use Markdown or backticks  
✅ Return only valid JSON with complete fields  
✅ Focus on how AI tools improve or impact SEO`;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const raw = aiResponse.choices[0].message.content;
    console.log('RAW OPENAI RESPONSE:', raw);

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let responseData = JSON.parse(cleaned);

    if (Array.isArray(responseData.ai_superpowers) && typeof responseData.ai_superpowers[0] === 'string') {
      responseData.ai_superpowers = responseData.ai_superpowers.map(item => {
        const [title, ...rest] = item.split(':');
        return { title: title.trim(), explanation: rest.join(':').trim() };
      });
    }

    if (Array.isArray(responseData.ai_opportunities) && typeof responseData.ai_opportunities[0] === 'string') {
      responseData.ai_opportunities = responseData.ai_opportunities.map(item => {
        const [title, ...rest] = item.split(':');
        return { title: title.trim(), explanation: rest.join(':').trim() };
      });
    }

    res.json(responseData);
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'OpenAI API call failed', details: err.message });
  }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running correctly on port ${PORT}`);
});
