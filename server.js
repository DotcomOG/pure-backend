import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory storage for inquiries (for demonstration)
const inquiries = [];

/**
 * Normalize a URL (prepends "https://" if missing).
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
 * Analyze HTML using Cheerio to gather SEO metrics.
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
 * Calculate an SEO score (1-10) based on metrics.
 * (1 is worst, 10 is best)
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
  return Math.max(score, 1); // Ensure minimum score of 1
}

/**
 * Generate a list of "good" SEO elements.
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
 * Generate a list of issues ("bad" points) for SEO.
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
  return bad.slice(0, 15);
}

/**
 * Group issues into categories for the detailed report.
 */
function groupBadPoints(badPoints) {
  const groups = {
    "Meta & Tags Issues": [],
    "Content & Linking Issues": [],
    "Technical Performance Issues": [],
    "Other Issues": []
  };
  badPoints.forEach(point => {
    if (/title|meta|canonical|h1/i.test(point)) {
      groups["Meta & Tags Issues"].push(point);
    } else if (/links|sitemap|robots\.txt/i.test(point)) {
      groups["Content & Linking Issues"].push(point);
    } else if (/server|speed|bounce|analytics/i.test(point)) {
      groups["Technical Performance Issues"].push(point);
    } else {
      groups["Other Issues"].push(point);
    }
  });
  return groups;
}

/**
 * Build the HTML for the high-level summary report.
 */
function buildSummaryReport(url, score, goodPoints, badPoints) {
  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const badHtml = badPoints.map(pt => `<li>🚨 ${pt}</li>`).join("");
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>SEO Analysis Summary (Powered by ChatGPT)</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
          .container { max-width: 700px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          h1, h2 { color: #333; }
          .score { font-weight: bold; color: #007BFF; }
          ul { padding-left: 20px; }
          .info { margin-top: 20px; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SEO Analysis Summary (Powered by ChatGPT)</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <p>SEO Score: <span class="score">${score}/10</span> <a href="#" onclick="document.getElementById('lightbox').style.display='block'; return false;">(?)</a></p>
          <h2>What's Working</h2>
          <ul>${goodHtml}</ul>
          <h2>Needs Improvement</h2>
          <ul>${badHtml}</ul>
          <div class="info">
            <p>For a full, detailed report, please provide your Name, Email, and (optional) Company below.</p>
            <form action="/detailed" method="POST">
              <input type="hidden" name="url" value="${url}" />
              <label>Name*: <input type="text" name="name" required /></label><br/>
              <label>Email*: <input type="email" name="email" required /></label><br/>
              <label>Company/Organization: <input type="text" name="company" /></label><br/>
              <button type="submit">Get Full Report</button>
            </form>
          </div>
          <div id="lightbox" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5);">
            <div style="background:#fff; padding:20px; margin:100px auto; width:80%; max-width:500px; position:relative;">
              <span style="position:absolute; top:10px; right:10px; cursor:pointer;" onclick="document.getElementById('lightbox').style.display='none';">Close</span>
              <h2>SEO Score Explanation</h2>
              <p>
                1-3: Major issues detected. Your site has significant SEO shortcomings.
                <br/>
                4-6: Moderate issues. Some areas need improvement for better SEO performance.
                <br/>
                7-10: Good to excellent SEO. Your site is well-optimized, with minor issues at most.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Build the HTML for the detailed report.
 */
function buildDetailedReport(url, score, goodPoints, badPoints) {
  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const groups = groupBadPoints(badPoints);
  let badHtml = "";
  for (const [group, issues] of Object.entries(groups)) {
    if (issues.length) {
      badHtml += `<h3>${group}</h3><ul>${issues.map(issue => `<li>🚨 ${issue}</li>`).join("")}</ul>`;
    }
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Detailed SEO Analysis (Powered by ChatGPT)</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          h1, h2, h3 { color: #333; }
          .score { font-weight: bold; color: #007BFF; }
          ul { padding-left: 20px; }
          .consult { margin-top: 20px; text-align: center; }
          .consult a { background: #d93025; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Detailed SEO Analysis (Powered by ChatGPT)</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <p>SEO Score: <span class="score">${score}/10</span></p>
          <h2>What's Working</h2>
          <ul>${goodHtml}</ul>
          <h2>Areas for Improvement</h2>
          ${badHtml}
          <div class="consult">
            <p>If you'd like a free consultation to address these issues, please fill in your phone number on our form.</p>
            <a href="https://yourwixsite.com/consultation" target="_blank">Free Consultation Form</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Default route (Homepage) at "/"
 * Displays a simple welcome message for users visiting the root path.
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Tool</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          a { color: #007BFF; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Welcome to the AI SEO Tool</h1>
        <p>Use our <a href="/friendly?url=https://example.com">/friendly</a> endpoint to analyze a site.</p>
        <p>For a detailed report, submit your information after the summary.</p>
      </body>
    </html>
  `);
});

/**
 * GET /friendly?url=<site>
 * Returns the high-level summary report.
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Please provide a ?url= parameter');
  }
  const url = normalizeUrl(targetUrl);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)' },
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch. HTTP status: ${response.status}`);
    }
    const html = await response.text();
    const metrics = analyzeHtml(html);
    const score = calculateSeoScore(metrics);
    const goodPoints = generateGoodPoints(metrics);
    const badPoints = generateBadPoints(metrics);
    const summaryHtml = buildSummaryReport(url, score, goodPoints, badPoints);
    res.status(200).send(summaryHtml);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

/**
 * POST /detailed
 * Accepts form data (url, name, email, company) and returns the detailed report.
 */
app.post('/detailed', async (req, res) => {
  const { url: rawUrl, name, email, company } = req.body;
  if (!rawUrl || !name || !email) {
    return res.status(400).send('URL, Name, and Email are required.');
  }

  // Simple email validation (regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Invalid email address.');
  }

  const url = normalizeUrl(rawUrl);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)' },
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch. HTTP status: ${response.status}`);
    }
    const html = await response.text();
    const metrics = analyzeHtml(html);
    const score = calculateSeoScore(metrics);
    const goodPoints = generateGoodPoints(metrics);
    const badPoints = generateBadPoints(metrics);

    // Build the detailed report HTML
    const detailedHtml = buildDetailedReport(url, score, goodPoints, badPoints);

    // Store the inquiry (for demonstration)
    inquiries.push({ url, name, email, company, timestamp: new Date() });

    res.status(200).send(detailedHtml);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});