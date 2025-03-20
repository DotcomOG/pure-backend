import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;

/**
 * Generates a random SEO score between 0 and 10 (inclusive).
 * In a real scenario, you'd implement actual scoring logic.
 */
function getRandomSeoScore() {
  return Math.floor(Math.random() * 11); // 0 to 10
}

/**
 * Creates a high-level editing recommendation.
 * In a real scenario, you'd analyze title/description/keywords more deeply.
 */
function generateReport(title, description, score) {
  let baseAdvice = "Make sure you have a concise, relevant title and meta description. " +
    "Consider adding more structured data, improving page speed, and ensuring mobile-friendliness.";

  return {
    summary: `This site scored ${score}/10 for AI-based SEO.`,
    titleAdvice: title
      ? `Your title is "${title}". Ensure it's under ~60 characters and clearly states what the page is about.`
      : "No title found. Consider adding a clear, concise title (under ~60 characters).",
    descriptionAdvice: description
      ? `Your meta description is "${description}". Try to keep it under ~155 characters and compelling.`
      : "No meta description found. Add a short, compelling description (under ~155 characters).",
    extraAdvice: baseAdvice
  };
}

app.get('/', async (req, res) => {
  const targetUrl = req.query.url;

  // If no URL is provided, return a helpful message
  if (!targetUrl) {
    return res.json({ message: 'Please provide a ?url= parameter' });
  }

  try {
    // Fetch the external URL's content
    const response = await fetch(targetUrl);
    const body = await response.text();

    // Attempt to extract <title> and meta description
    const titleMatch = body.match(/<title>(.*?)<\/title>/i);
    const descriptionMatch = body.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);

    // Prepare a random SEO score
    const seoScore = getRandomSeoScore();

    // Build a user-friendly report
    const pageTitle = titleMatch ? titleMatch[1] : null;
    const pageDescription = descriptionMatch ? descriptionMatch[1] : null;
    const report = generateReport(pageTitle, pageDescription, seoScore);

    // Return a JSON object with the essential info
    res.json({
      testedUrl: targetUrl,
      seoScore: seoScore,
      report: report
      // No raw HTML included, so it's more human-friendly
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});