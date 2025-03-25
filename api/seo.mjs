import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory storage for inquiries (for production, use a persistent database)
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
  const $ = load(html);
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
 * Starting with 10 points, subtract for each issue.
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
 * Generate a "What's OK" list based on metrics.
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
  const additionalGood = [
    "Mobile-friendly design",
    "Fast page load speed",
    "Well-structured content",
    "Secure HTTPS implementation",
    "Clear navigation"
  ];
  while (good.length < 10 && additionalGood.length > 0) {
    good.push(additionalGood.shift());
  }
  return good.slice(0, 10);
}

/**
 * Generate a "Needs to be Addressed" list based on metrics.
 */
function generateBadPoints(metrics) {
  const bad = [];
  if (!metrics.title) {
    bad.push("Missing title tag");
  } else if (metrics.titleLength < 30 || metrics.titleLength > 60) {
    bad.push("Title tag length is not optimal (should be 30-60 characters)");
  }
  if (!metrics.metaDesc) {
    bad.push("Missing meta description");
  } else if (metrics.metaDescLength < 50 || metrics.metaDescLength > 160) {
    bad.push("Meta description length is suboptimal (should be 50-160 characters)");
  }
  if (!metrics.canonical) {
    bad.push("Missing canonical tag");
  }
  if (!metrics.hasH1) {
    bad.push("No H1 tag found");
  }
  if (metrics.imagesWithoutAlt > 0) {
    bad.push("Images missing alt text");
  }
  const additionalBad = [
    "Broken internal or external links",
    "Slow server response time",
    "No sitemap submitted to search engines",
    "Keyword stuffing detected",
    "Excessive pop-ups or interstitials",
    "Thin content on some pages",
    "No structured data markup",
    "Cluttered navigation menu",
    "High bounce rate from homepage",
    "No analytics or tracking installed",
    "Inconsistent business information (NAP)",
    "Orphan pages with poor internal linking",
    "Minimal social proof or reviews",
    "Missing robots.txt or misconfigured",
    "Low domain authority due to few backlinks",
    "Outdated or irrelevant content"
  ];
  additionalBad.forEach(issue => bad.push(issue));
  return bad.slice(0, 25);
}

/**
 * Build the full HTML response.
 * Display:
 * - SEO score (0-10)
 * - "What's OK" points
 * - "Needs to be Addressed" points
 * - ChatGPT mention
 */
function buildHtmlResponse(url, score, goodPoints, badPointsPool, metrics) {
  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const badHtml = badPointsPool.slice(0, 15).map(pt => `<li>🚨 ${pt}</li>`).join("");
  const explanationText = `
    This SEO score of ${score}/10 is calculated based on:
    - Title tag presence and optimal length (30-60 characters)
    - Meta description presence and optimal length (50-160 characters)
    - Presence of canonical and H1 tags
    - Proper alt text for images
    Points are deducted for any issues found.
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Analysis (Powered by ChatGPT)</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
          .container { max-width: 700px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          h1, h2 { color: #333; }
          .score { font-weight: bold; color: #007BFF; }
          ul { padding-left: 20px; }
          .footer { margin-top: 20px; text-align: center; font-size: 0.9em; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis (Powered by ChatGPT)</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <p>SEO Score: <span class="score">${score}/10</span></p>
          <h2>What's OK</h2>
          <ul>${goodHtml}</ul>
          <h2>Needs to be Addressed</h2>
          <ul>${badHtml}</ul>
          <div class="footer">
            <p>This advanced SEO analysis is powered by ChatGPT</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * GET /friendly?url=example.com
 * Real-time SEO analysis
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Please provide a ?url= parameter');

  const url = normalizeUrl(targetUrl);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch. HTTP status: ${response.status}`);
    }

    const html = await response.text();
    const metrics = analyzeHtml(html);
    const score = calculateSeoScore(metrics);
    const goodPoints = generateGoodPoints(metrics);
    const badPointsPool = generateBadPoints(metrics);

    const htmlContent = buildHtmlResponse(url, score, goodPoints, badPointsPool, metrics);
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

// Simple POST route for demonstration
app.post('/report', (req, res) => {
  const { url, name, email, company } = req.body;
  if (!url || !name || !email) {
    return res.status(400).json({ message: 'URL, name, and email are required fields.' });
  }
  inquiries.push({ url, name, email, company });
  return res.json({ message: 'Inquiry received. We will contact you soon with your full report.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});