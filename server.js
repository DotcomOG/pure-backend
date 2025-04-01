const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log("Starting server...");

// Serve static files from the "public" folder
app.use(express.static('public'));

// Log every request for debugging
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// API endpoint returning JSON data
app.get('/friendly', (req, res) => {
  console.log("Handling /friendly request");
  const data = {
    url: "https://adl.org",
    score: 60,
    ai_superpowers: [
      {
        title: "User Experience Optimization",
        explanation: "The site is currently redirecting users, impacting their experience negatively."
      }
    ],
    ai_opportunities: [
      {
        title: "Content Optimization",
        explanation: "There is no visible content on the page, which could be optimized for better search engine visibility."
      }
    ],
    ai_engine_insights: {
      ChatGPT: "No visible content to analyze.",
      Claude: "No visible content to analyze.",
      "Google Gemini": "No visible content to analyze.",
      "Microsoft Copilot": "No visible content to analyze.",
      "Jasper AI": "No visible content to analyze."
    }
  };
  res.json(data);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});