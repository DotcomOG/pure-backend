const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/friendly', (req, res) => {
  const inspectedUrl = req.query.url || "https://example.com";

  // Dynamic and expanded example data
  const data = {
    url: inspectedUrl,
    score: 75,
    ai_superpowers: [
      { title: "Clear Navigation", explanation: "The site navigation is clear and effective." },
      { title: "Fast Load Time", explanation: "The website loads quickly, enhancing user experience." },
      { title: "Mobile Optimized", explanation: "The site is fully responsive on mobile devices." },
      { title: "Strong Meta Descriptions", explanation: "Meta descriptions are compelling and optimized." },
      { title: "Secure Connection (HTTPS)", explanation: "The site uses a secure HTTPS connection." }
    ],
    ai_opportunities: [
      { title: "Image Optimization", explanation: "Images can be compressed further for faster loading." },
      { title: "Keyword Improvements", explanation: "Content could target additional relevant keywords." },
      { title: "Fix Broken Links", explanation: "Some internal links are broken, harming SEO." },
      { title: "Improve Accessibility", explanation: "Some elements are not fully accessible to all users." },
      { title: "Optimize Title Tags", explanation: "Title tags are either too short or too generic." },
      { title: "Enhance Social Sharing", explanation: "Meta tags for social media sharing can be improved." },
      { title: "Structured Data Missing", explanation: "Structured data markup is absent or incomplete." },
      { title: "Server Response Time", explanation: "Server response time could be faster." },
      { title: "Add Sitemap", explanation: "A sitemap.xml file is missing or outdated." },
      { title: "Reduce JavaScript", explanation: "Too much JS affects page loading speeds." }
    ],
    ai_engine_insights: {
      ChatGPT: `The content on ${inspectedUrl} is structured clearly.`,
      Claude: `Visual enhancements recommended for ${inspectedUrl}.`,
      "Google Gemini": `${inspectedUrl} shows strong relevance for primary keywords.`,
      "Microsoft Copilot": `Improvement of internal linking structure suggested for ${inspectedUrl}.`,
      "Jasper AI": `Interactive elements could boost engagement on ${inspectedUrl}.`
    }
  };

  res.json(data);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});// redeploy trigger comment
