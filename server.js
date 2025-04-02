const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/friendly', (req, res) => {
  const url = req.query.url || "https://example.com";

  const data = {
    url,
    score: 82,
    ai_superpowers: [
      {
        title: "Clear and Intuitive Navigation",
        explanation: "The website navigation structure is straightforward and user-friendly. Users can easily access important content, improving user experience and reducing bounce rates. Clear navigation also helps search engines index the site effectively."
      },
      {
        title: "Fast Page Load Speeds",
        explanation: "Pages load rapidly, significantly enhancing user satisfaction and engagement. Fast-loading pages are favored by Google's algorithm, resulting in potentially better rankings and improved visitor retention."
      },
      {
        title: "Mobile-Friendly Design",
        explanation: "The site is fully optimized for mobile devices, providing a seamless experience across smartphones and tablets. Mobile optimization is crucial for SEO, as Google prioritizes mobile-first indexing."
      }
    ],
    ai_opportunities: [
      {
        title: "Missing Structured Data",
        explanation: "The website currently lacks structured data markup (JSON-LD or Schema.org tags), which helps search engines better understand content. Implementing structured data can significantly enhance search visibility and rich snippets appearance."
      },
      {
        title: "Image Optimization Needed",
        explanation: "Several images are not optimized for web, leading to slower load times. Compressing and resizing images appropriately can improve page performance, SEO rankings, and overall user experience."
      },
      {
        title: "Meta Tags Optimization",
        explanation: "Meta descriptions and titles across several pages are either missing or duplicated. Unique, engaging meta tags help drive click-through rates from search results, boosting organic traffic and overall site performance."
      },
      {
        title: "Internal Linking Structure",
        explanation: "The website's internal linking structure is weak, making some pages harder to discover by users and search engine bots. Strengthening internal links helps distribute link authority throughout the site, improving page rankings."
      },
      {
        title: "Server Response Time",
        explanation: "The server response time occasionally exceeds recommended limits, slowing initial page loads. Optimizing backend infrastructure or using caching mechanisms can drastically improve loading speeds and user experience."
      }
    ],
    ai_engine_insights: {
      ChatGPT: `The website effectively utilizes natural language content, which makes it suitable for ChatGPT-powered applications. However, more detailed content around key topics would enhance its semantic SEO performance and AI discoverability.`,
      Claude: `Claude’s AI highlights that the site's content is well-structured but lacks engaging visual elements and interactive content that could further enhance user engagement and dwell time.`,
      "Google Gemini": `Google Gemini identifies the strong keyword relevance of your primary pages. However, it suggests improving structured data and semantic markup to maximize search engine visibility and enhance search result snippets.`,
      "Microsoft Copilot": `Copilot’s analysis indicates your site's content is thorough and relevant. To improve further, enhance internal linking and structured data, making content more easily discoverable by AI-driven indexing.`,
      "Jasper AI": `Jasper AI points out that while content quality is high, the site lacks dynamic and interactive elements like quizzes, calculators, or visual tools, which could significantly increase user engagement and conversion rates.`
    }
  };

  res.json(data);
});

app.listen(port, () => {
  console.log(`Server running robust backend responses on port ${port}`);
});