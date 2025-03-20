import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// In-memory storage for inquiries (For production, replace with a database)
const inquiries = [];

/**
 * Normalize URLs:
 * Accepts `example.com`, `www.example.com`, or full URLs.
 * Prepends `https://` if missing.
 */
function normalizeUrl(url) {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed.replace(/^www\./, '');
  }
  return trimmed;
}

/**
 * Placeholder function for AI SEO Scoring.
 * Replace with real-world calculations.
 */
function calculateSeoScore() {
  return Math.floor(Math.random() * 10) + 1; // Generates a score between 1-10
}

/**
 * Returns up to 10 "OK" points.
 */
function getGoodPoints() {
  const allGood = [
    "Mobile-friendly design",
    "Fast page load speed",
    "Clear call-to-action buttons",
    "Secure HTTPS implementation",
    "Logical internal linking",
    "Well-structured HTML headings",
    "Readable font and layout",
    "Up-to-date contact information",
    "No broken links",
    "Optimized image sizes",
  ];
  return allGood.slice(0, 10);
}

/**
 * Returns up to 25 "Needs to be Addressed" points.
 * The initial report shows 15; full report adds the remaining 10.
 */
function getBadPoints() {
  return [
    "Missing or weak meta descriptions",
    "Duplicate or missing title tags",
    "No structured data markup",
    "Unoptimized images without alt text",
    "Broken external/internal links",
    "Slow server response time",
    "No XML sitemap submitted",
    "Poor keyword targeting",
    "Excessive pop-ups or interstitials",
    "No robots.txt file",
    "Low word count (thin content)",
    "Lack of mobile optimization",
    "High bounce rate",
    "No Google Analytics installed",
    "SSL certificate issues",
    "Missing canonical tags",
    "No backlinks from reputable sites",
    "Orphan pages (not linked internally)",
    "Inconsistent business name, address, or phone number",
    "Poor accessibility (missing ARIA tags)",
    "Content not updated frequently",
    "No blog or fresh content strategy",
    "Overly complex site navigation",
    "Minimal social media integration",
    "Spammy outbound links"
  ];
}

/**
 * Generates the HTML report.
 */
function buildHtmlResponse(url, score, goodPoints, badPoints) {
  const initialBad = badPoints.slice(0, 15);
  const remainingBad = badPoints.slice(15);

  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const badHtml = initialBad.map(pt => `<li>🚨 ${pt}</li>`).join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Analysis</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f9f9f9; }
          .container { max-width: 700px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          .score { font-weight: bold; color: #007BFF; font-size: 1.2em; }
          ul { padding-left: 20px; }
          .form-section { margin-top: 30px; background: #f0f0f0; padding: 15px; border-radius: 6px; }
          .form-section input { width: 100%; margin: 5px 0; padding: 5px; }
          .hidden { display: none; }
          .cta { text-align: center; padding: 10px; background: #fdecea; border-radius: 6px; margin-top: 20px; }
          .cta a { color: #d93025; font-weight: bold; text-decoration: none; }
          .cta a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis 🔎</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <p>Score: <span class="score">${score}/10</span></p>

          <h2>What's OK</h2>
          <ul>${goodHtml}</ul>

          <h2>Needs to be Addressed</h2>
          <ul>${badHtml}</ul>

          <div class="form-section">
            <p><strong>Get your full report</strong></p>
            <label>Name*:</label>
            <input type="text" id="userName" /><br/>
            <label>Email*:</label>
            <input type="text" id="userEmail" /><br/>
            <label>Company:</label>
            <input type="text" id="userCompany" /><br/>
            <button id="getReportBtn">Get Full Report</button>
          </div>

          <div id="detailedReport" class="hidden">
            <h2>Detailed Report</h2>
            <ul>${remainingBad.map(pt => `<li>🚨 ${pt}</li>`).join("")}</ul>
            <div class="cta">
              <p>Need expert AI marketing help? <a href="https://calendly.com/theyoramezra" target="_blank">Schedule a call now!</a></p>
            </div>
          </div>
        </div>

        <script>
          document.getElementById('getReportBtn').addEventListener('click', function() {
            let name = document.getElementById('userName').value.trim();
            let email = document.getElementById('userEmail').value.trim();
            if (!name || !email) {
              alert("Name and Email are required.");
              return;
            }
            document.querySelector('.form-section').style.display = 'none';
            document.getElementById('detailedReport').classList.remove('hidden');
          });
        </script>
      </body>
    </html>
  `;
}

app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Provide a ?url= parameter');

  const url = normalizeUrl(targetUrl);
  const score = calculateSeoScore();
  const html = buildHtmlResponse(url, score, getGoodPoints(), getBadPoints());

  res.status(200).send(html);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});