const express = require('express');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const reports = {}; // Store reports by URL

async function generateReport(url) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{
        role: 'system',
        content: `
        Analyze the provided URL deeply and carefully for SEO:
        - Provide a "score" (0-100)
        - Give 1-5 detailed strengths ("ai_superpowers")
        - Give 1-10 detailed weaknesses ("ai_opportunities")
        - Give clear insights (2-5 sentences) from ChatGPT, Claude, Gemini, Copilot, Jasper
        Respond ONLY in valid JSON exactly matching:
        {
          "url": "<provided-url>",
          "score": numeric-value,
          "ai_superpowers": [{title:"", explanation:""}],
          "ai_opportunities": [{title:"", explanation:""}],
          "ai_engine_insights": {"ChatGPT":"", "Claude":"", "Gemini":"", "Copilot":"", "Jasper":""}
        }`
      },{
        role: 'user',
        content: `Analyze this site: ${url}`
      }],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Robust parsing and error checking
    try {
      reports[url] = JSON.parse(completion.choices[0].message.content);
    } catch (jsonError) {
      console.error("Invalid JSON from OpenAI:", completion.choices[0].message.content);
      reports[url] = { error: "Invalid response from AI model. Please retry." };
    }

  } catch (error) {
    console.error("OpenAI API error:", error);
    reports[url] = { error: "Error generating report. Please retry." };
  }
}

app.get('/friendly', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL parameter is required." });

  if (reports[url]) {
    if (reports[url].error) {
      res.status(500).json({ error: reports[url].error });
    } else {
      res.json(reports[url]);
    }
  } else {
    generateReport(url);
    res.status(202).json({ status: "processing" });
  }
});

app.listen(port, () => {
  console.log(`Dynamic AI SEO backend running clearly on port ${port}`);
});