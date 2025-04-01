const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Dynamic /friendly API endpoint that properly uses the URL query parameter
app.get('/friendly', (req, res) => {
  const inspectedUrl = req.query.url || "https://example.com";

  // This is the dynamically generated JSON response:
  const data = {
    url: inspectedUrl,
    score: 75, // Static example score (later replace with dynamic calculation)
    ai_superpowers: [
      {
        title: "Clear Navigation",
        explanation: "The site navigation is clear and effective, improving user experience and SEO."
      }
    ],
    ai_opportunities: [
      {
        title: "Improve Load Speed",
        explanation: "Load speed can be optimized to enhance user experience and improve ranking."
      }
    ],
    ai_engine_insights: {
      "ChatGPT": `The content on ${inspectedUrl} is well-structured for readability.`,
      "Claude": `The site ${inspectedUrl} could leverage more visuals for engagement.`,
      "Google Gemini": `${inspectedUrl} has strong keyword relevance.`,
      "Microsoft Copilot": `Navigation enhancements are recommended for ${inspectedUrl}.`,
      "Jasper AI": `${inspectedUrl} would benefit from interactive content features.`
    }
  };

  res.json(data);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});