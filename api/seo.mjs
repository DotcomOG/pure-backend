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
 * Generate up to 10 "good" points (OK with website).
 */
function generateGoodPoints() {
  const goodPointsPool = [
    "Responsive mobile design",
    "Fast page load speed",
    "Well-structured content hierarchy",
    "Optimized image sizes",
    "Clear call-to-action buttons",
    "Consistent branding across pages",
    "Logical internal linking",
    "Secure HTTPS implementation",
    "Readable typography and layout",
    "Up-to-date contact information",
    "Use of heading tags (H1, H2, H3)",
    "Basic keyword research implemented",
    "Accessible color contrast",
    "Social media integration"
  ];
  // Randomly pick a number up to 10
  const count = Math.floor(Math.random() * 10) + 1; // 1 to 10
  // Shuffle and pick 'count' items
  return goodPointsPool.sort(() => 0.5 - Math.random()).slice(0, count);
}

/**
 * Generate up to 20 "needed to be addressed" points (bad or suboptimal).
 */
function generateBadPoints() {
  const badPointsPool = [
    "Missing meta descriptions on some pages",
    "Overly long or duplicated title tags",
    "Slow server response time",
    "Images lacking alt text",
    "No sitemap submitted to search engines",
    "Keyword stuffing in certain pages",
    "Large uncompressed images hurting speed",
    "Broken internal or external links",
    "Poor mobile scrolling experience",
    "Excessive use of pop-ups or interstitials",
    "Thin content with insufficient detail",
    "No structured data markup",
    "Cluttered navigation menu",
    "SSL certificate issues or mixed content",
    "No canonical tags on duplicate pages",
    "High bounce rate from homepage",
    "No analytics or tracking in place",
    "Inconsistent NAP (Name, Address, Phone)",
    "Orphan pages with no internal links",
    "Minimal social proof or reviews",
    "Inaccessible forms or buttons",
    "Missing robots.txt or poorly configured",
    "Low domain authority from few backlinks",
    "Outdated or irrelevant content"
  ];
  // Randomly pick a number up to 20
  const count = Math.floor(Math.random() * 20) + 1; // 1 to 20
  // Shuffle and pick 'count' items
  return badPointsPool.sort(() => 0.5 - Math.random()).slice(0, count);
}

/**
 * Generate a more "detailed" explanation for each bad point for the full report.
 */
function generateDetailedExplanations(badPoints) {
  // For demonstration, we'll just add some extra text to each bad point.
  return badPoints.slice(0, 10).map((point, idx) => {
    return `Detailed Explanation #${idx + 1}: ${point} — This issue requires additional focus. Addressing it can significantly improve SEO and user experience.`;
  });
}

/**
 * Build the user-friendly HTML page.
 *  - Up to 10 good points
 *  - Up to 20 bad points
 *  - A form for name, email, company, plus a "Get Full Report" button
 *  - JavaScript that hides the good points and replaces the bullet list with a "long form" of up to 10 items once user provides name/email
 */
function buildHtmlResponse(url, score, goodPoints, badPoints) {
  // Convert "good" points into bullet list
  const goodList = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");

  // Convert "bad" points into bullet list
  const badList = badPoints.map(pt => `<li>⚠️ ${pt}</li>`).join("");

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
            background: #f9f9f9;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
          }
          .score {
            font-weight: bold;
            color: #007BFF;
            font-size: 1.2em;
          }
          .sections {
            margin-top: 20px;
          }
          .sections ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .form-section {
            margin-top: 30px;
            background: #f0f0f0;
            padding: 15px;
            border-radius: 6px;
          }
          .form-section label {
            display: inline-block;
            width: 100px;
            margin-right: 10px;
          }
          .form-section input {
            margin-bottom: 10px;
            padding: 5px;
            width: 60%;
          }
          .hidden {
            display: none;
          }
          .detailed-report {
            margin-top: 20px;
            background: #fff7e6;
            padding: 15px;
            border-radius: 6px;
          }
          .detailed-report ul {
            margin: 10px 0;
            padding-left: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis 🔎</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <p>Score: <span class="score">${score}/10</span></p>

          <div class="sections" id="initialSections">
            <h2>What's OK (up to 10)</h2>
            <ul id="goodPoints">
              ${goodList}
            </ul>
            <h2>Needs to be addressed (up to 20)</h2>
            <ul id="badPoints">
              ${badList}
            </ul>
          </div>

          <div class="form-section">
            <p><strong>Get your full report</strong></p>
            <p>Fields with * are required.</p>
            <label>Name*:</label>
            <input type="text" id="userName" /><br/>
            <label>Email*:</label>
            <input type="text" id="userEmail" /><br/>
            <label>Company:</label>
            <input type="text" id="userCompany" /><br/>
            <button id="getReportBtn">Get Full Report</button>
          </div>

          <div class="detailed-report hidden" id="detailedReportSection">
            <h2>Detailed Explanations (up to 10 items to address)</h2>
            <ul id="detailedList"></ul>
          </div>
        </div>

        <script>
          const getReportBtn = document.getElementById('getReportBtn');
          const userName = document.getElementById('userName');
          const userEmail = document.getElementById('userEmail');
          const userCompany = document.getElementById('userCompany');

          const initialSections = document.getElementById('initialSections');
          const detailedReportSection = document.getElementById('detailedReportSection');
          const detailedList = document.getElementById('detailedList');

          // We embedded the "bad points" in the page so we can show them in detail
          // after user provides name & email. We'll store them in a data attribute for simplicity.
          // We'll parse them from the existing <ul id="badPoints"> content, or we can embed them as JSON.

          // For a simpler approach, let's embed them in a hidden JSON script:
        </script>

        <!-- We'll embed a JSON with the bad points for detailed explanation. -->
        <script id="badPointsJson" type="application/json">
          ${JSON.stringify(badPoints)}
        </script>

        <script>
          // We'll generate a detailed explanation for each bad point once user submits the form
          function generateDetailedExplanations(points) {
            // We'll limit to 10
            const limited = points.slice(0, 10);
            return limited.map((pt, idx) => {
              return \`<li>🔎 Detailed #\${idx+1}: \${pt} — This issue requires more attention to improve SEO & user experience.</li>\`;
            }).join("");
          }

          getReportBtn.addEventListener('click', () => {
            // Validate
            if (!userName.value.trim() || !userEmail.value.trim()) {
              alert("Name and Email are required.");
              return;
            }
            // Hide the "good points" & "bad points" from initialSections
            initialSections.style.display = 'none';

            // Show the detailed section
            detailedReportSection.classList.remove('hidden');

            // Grab the bad points from the JSON
            const badPointsData = document.getElementById('badPointsJson').textContent;
            const badPointsArray = JSON.parse(badPointsData);

            // Generate the long form detail
            detailedList.innerHTML = generateDetailedExplanations(badPointsArray);
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * GET /friendly?url=example.com
 * Returns an HTML page with:
 *  - random SEO score
 *  - up to 10 "good" bullet points
 *  - up to 20 "bad" bullet points
 *  - a form that, when user enters name/email, hides good points & shows a "long form" for up to 10 items to address
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Please provide a ?url= parameter');
  }

  const normalizedUrl = normalizeUrl(targetUrl);

  try {
    // Attempt to fetch the site (for demonstration)
    const response = await fetch(normalizedUrl);
    await response.text();

    const score = getRandomSeoScore();
    const goodPoints = generateGoodPoints();
    const badPoints = generateBadPoints();

    const htmlContent = buildHtmlResponse(normalizedUrl, score, goodPoints, badPoints);
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

/**
 * (Optional) POST /report
 * Accepts JSON with { url, name, email, company } if needed for further logic
 */
app.post('/report', async (req, res) => {
  const { url, name, email, company } = req.body;
  if (!url || !name || !email) {
    return res.status(400).json({ message: 'URL, name, and email are required fields.' });
  }
  return res.json({
    message: "Detailed report generation not fully implemented in this example."
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});