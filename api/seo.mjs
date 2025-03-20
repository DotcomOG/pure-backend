import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// In-memory storage for inquiries (for production, use a database)
const inquiries = [];

/**
 * Normalize a URL.
 * Accepts "xxx.com" or "www.xxx.com" and prepends "https://".
 */
function normalizeUrl(url) {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^www\./i, '');
    return "https://" + trimmed;
  }
  return trimmed;
}

/**
 * Analyze HTML using Cheerio and return metrics.
 */
function analyzeHtml(html) {
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || "";
  const canonical = $('link[rel="canonical"]').attr('href') || "";
  const h1 = $('h1').first().text().trim();
  const images = $('img');
  let imagesWithoutAlt = 0;

  images.each((i, el) => {
    if (!$(el).attr('alt')) {
      imagesWithoutAlt++;
    }
  });

  return {
    title,
    titleLength: title.length,
    metaDesc: metaDesc.trim(),
    metaDescLength: metaDesc.trim().length,
    canonical: canonical.trim(),
    hasH1: h1.length > 0,
    totalImages: images.length,
    imagesWithoutAlt
  };
}

/**
 * Calculate a real SEO score based on HTML analysis.
 */
function calculateSeoScore(metrics) {
  let score = 10;
  if (!metrics.title) score -= 2;
  else if (metrics.titleLength < 30 || metrics.titleLength > 60) score -= 1;
  if (!metrics.metaDesc) score -= 2;
  else if (metrics.metaDescLength < 50 || metrics.metaDescLength > 160) score -= 1;
  if (!metrics.canonical) score -= 2;
  if (!metrics.hasH1) score -= 1;
  if (metrics.imagesWithoutAlt > 0) score -= Math.min(metrics.imagesWithoutAlt, 3);
  return Math.max(score, 0);
}

/**
 * Generate "What's OK" list based on metrics.
 */
function generateGoodPoints(metrics) {
  const good = [];
  if (metrics.title && metrics.titleLength >= 30 && metrics.titleLength <= 60) {
    good.push("Title tag is properly set and of optimal length");
  }
  if (metrics.metaDesc && metrics.metaDescLength >= 50 && metrics.metaDescLength <= 160) {
    good.push("Meta description is present and optimized");
  }
  if (metrics.canonical) {
    good.push("Canonical tag is present");
  }
  if (metrics.hasH1) {
    good.push("H1 tag is present");
  }
  if (metrics.totalImages > 0 && metrics.imagesWithoutAlt === 0) {
    good.push("All images have alt text");
  }
  return good.slice(0, 10);
}

/**
 * Generate "Needs to be Addressed" list based on metrics.
 */
function generateBadPoints(metrics) {
  const bad = [];
  if (!metrics.title) bad.push("Missing title tag");
  else if (metrics.titleLength < 30 || metrics.titleLength > 60) bad.push("Title tag length is not optimal");

  if (!metrics.metaDesc) bad.push("Missing meta description");
  else if (metrics.metaDescLength < 50 || metrics.metaDescLength > 160) bad.push("Meta description length is suboptimal");

  if (!metrics.canonical) bad.push("Missing canonical tag");
  if (!metrics.hasH1) bad.push("No H1 tag found");
  if (metrics.imagesWithoutAlt > 0) bad.push("Images missing alt text");

  return bad.slice(0, 25);
}

/**
 * GET /analyze?url=example.com
 * Performs real-time analysis of the given URL.
 */
app.get('/analyze', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Please provide a ?url= parameter');

  const url = normalizeUrl(targetUrl);
  try {
    const response = await fetch(url);
    const html = await response.text();

    const metrics = analyzeHtml(html);
    const score = calculateSeoScore(metrics);
    const goodPoints = generateGoodPoints(metrics);
    const badPoints = generateBadPoints(metrics);

    res.status(200).json({
      url,
      score,
      goodPoints,
      badPoints
    });

  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

/**
 * POST /report
 * Stores inquiries in memory (future improvement: database storage)
 */
app.post('/report', (req, res) => {
  const { url, name, email, company } = req.body;
  if (!url || !name || !email) {
    return res.status(400).json({ message: 'URL, name, and email are required fields.' });
  }

  inquiries.push({ url, name, email, company });
  return res.json({ message: 'Inquiry received. We will contact you soon with your full report.' });
});

/**
 * Start Express Server
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});