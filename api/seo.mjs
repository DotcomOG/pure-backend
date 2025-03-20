import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

/**
 * Normalize a URL:
 * If the URL does not start with http:// or https://, prepend https://.
 */
function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return "https://" + trimmed;
  }
  return trimmed;
}

/**
 * Generate a random SEO score between 0 and 10.
 * (Replace with your actual scoring logic later.)
 */
function getRandomSeoScore() {
  return Math.floor(Math.random() * 11); // Score from 0 to 10
}

/**
 * Generate a short summary about the site based on the score.
 */
function generateSummary(url, score) {
  let summary = `The site ${url} has a preliminary SEO score of ${score}/10. `;
  if (score < 5) {
    summary += "It appears the site's SEO needs significant improvement. Consider optimizing title tags, meta descriptions, and page load speed.";
  } else if (score < 8) {
    summary += "The site's SEO is moderate but could be improved. Focus on enhancing content quality and technical SEO factors.";
  } else {
    summary += "The site's SEO appears strong. Minor tweaks might further optimize performance.";
  }
  return summary;
}

/**
 * Return a simple HTML page with the results.
 */
function buildHtmlResponse(url, score, summary) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Analysis</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          h1 {
            color: #333;
          }
          .score {
            font-weight: bold;
            color: #007BFF;
          }
          .summary {
            margin-top: 20px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <p>Score: <span class="score">${score}/10</span></p>
          <div class="summary">${summary}</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * GET /friendly?url=example.com
 * Returns an HTML page with a user-friendly report.
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Please provide a ?url= parameter');
  }

  const normalizedUrl = normalizeUrl(targetUrl);

  try {
    // Attempt to fetch the site (not strictly needed for scoring, but here as a placeholder)
    const response = await fetch(normalizedUrl);
    await response.text(); // We won't display raw HTML, just verifying we can fetch it

    const seoScore = getRandomSeoScore();
    const summary = generateSummary(normalizedUrl, seoScore);

    // Build an HTML response
    const htmlContent = buildHtmlResponse(normalizedUrl, seoScore, summary);
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

/**
 * POST /report
 * Accepts JSON with { url, name, email, company } for a more detailed future logic
 */
app.post('/report', async (req, res) => {
  const { url, name, email, company } = req.body;
  if (!url || !name || !email) {
    return res.status(400).json({ message: 'URL, name, and email are required fields.' });
  }

  const normalizedUrl = normalizeUrl(url);
  try {
    // Here, you'd do your advanced logic (like fetching the site, analyzing, etc.)
    const seoScore = getRandomSeoScore();
    const summary = generateSummary(normalizedUrl, seoScore);

    // Return a JSON with more details
    return res.json({
      inspectedUrl: normalizedUrl,
      name,
      email,
      company: company || "Not provided",
      seoScore,
      summary
    });
  } catch (error) {
    console.error("Error generating detailed report:", error);
    res.status(500).send('Error generating detailed report');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});