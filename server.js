const express = require('express');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const reports = {};

async function generateReport(url, detail = "summary") {
  try {
    const promptDetail = detail === "full" 
      ? `Provide an extensive, detailed, sales-oriented SEO audit designed to clearly demonstrate deep expertise and encourage consulting engagements. 
         Explicitly include:
         - SEO score (0-100)
         - Exactly 8-10 detailed SEO strengths ("ai_superpowers")
         - Exactly 20-30 detailed SEO weaknesses ("ai_opportunities")
         - Clearly written, highly detailed, actionable insights (5-7 sentences each) from ChatGPT, Claude, Gemini, Copilot, and Jasper AI`
      : `Provide a concise SEO audit summary clearly indicating key strengths and areas for improvement.
         Explicitly include:
         - SEO score (0-100)
         - Exactly 5 detailed SEO strengths ("ai_superpowers")
         - Exactly 10 detailed SEO weaknesses ("ai_opportunities")
         - Clear, brief insights (2-4 sentences each) from ChatGPT, Claude, Gemini, Copilot, and Jasper AI`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{
        role: 'system',
        content: `
        Carefully analyze the provided URL for SEO:
        ${promptDetail}
        Respond ONLY in valid JSON exactly matching:
        {
          "url": "<provided-url>",
          "score": numeric-value,
          "ai_superpowers": [{title:"", explanation:""}],
          "ai_opportunities": [{title:"", explanation:""}],
          "ai_engine_insights": {
            "ChatGPT": "...",
            "Claude": "...",
            "Gemini": "...",
            "Copilot": "...",
            "Jasper": "..."
          }
        }`
      },{
        role: 'user',
        content: `Analyze this site: ${url}`
      }],
      temperature: 0.5,
      max_tokens: detail === "full" ? 2500 : 1200,
      response_format: { type: "json_object" }
    });

    try {
      reports[url + detail] = JSON.parse(completion.choices[0].message.content);
    } catch (jsonError) {
      console.error("Invalid JSON from OpenAI:", completion.choices[0].message.content);
      reports[url + detail] = { error: "Invalid response from AI model. Please retry." };
    }

  } catch (error) {
    console.error("OpenAI API error:", error);
    reports[url + detail] = { error: "Error generating report. Please retry." };
  }
}

app.get('/friendly', (req, res) => {
  const url = req.query.url;
  const detail = req.query.detail || "summary";
  if (!url) return res.status(400).json({ error: "URL parameter is required." });

  const reportKey = url + detail;
  if (reports[reportKey]) {
    if (reports[reportKey].error) {
      res.status(500).json({ error: reports[reportKey].error });
    } else {
      res.json(reports[reportKey]);
    }
  } else {
    generateReport(url, detail);
    res.status(202).json({ status: "processing" });
  }
});

app.listen(port, () => {
  console.log(`Dynamic AI SEO backend running clearly on port ${port}`);
});