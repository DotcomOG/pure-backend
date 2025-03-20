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
 * We'll remove any random scoring and just pick a fixed score of 7 out of 10,
 * or you can change the number here if you want a different default.
 */
function getFixedSeoScore() {
  return 7; // Always 7/10 for demonstration
}

/**
 * Exactly 10 "good" points.
 */
function getGoodPoints() {
  // 14 possible “good” points
  const pool = [
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
  // Force exactly 10 from the top
  return pool.slice(0, 10);
}

/**
 * Exactly 20 "needed to be addressed" points.
 */
function getBadPoints() {
  // 24 possible “bad” points
  const pool = [
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
  // Force exactly 20 from the top
  return pool.slice(0, 20);
}

/**
 * Generate up to 10 "detailed" items from the "bad" points for the final report.
 */
function generateDetailedExplanations(badPoints) {
  // We'll limit to 10 for the final report
  return badPoints.slice(0, 10).map((pt, idx) => {
    return `🔎 Detailed #${idx + 1}: ${pt} — This issue requires more attention to improve SEO & user experience.`;
  });
}

/**
 * Build the user-friendly HTML page.
 */
function buildHtmlResponse(url, score, goodPoints, badPoints) {
  // Convert "good" points into bullet list
  const goodList = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");

  // Convert "bad" points into bullet list
  const badList = badPoints.map(pt => `<li>⚠️ ${pt}</li>`).join("");

  // Explanation text for the score (we can keep it simple)
  const explanationText = `
    This SEO score is a fixed demonstration score of ${score}/10. 
    In a real scenario, you'd calculate it based on site speed, mobile-friendliness, 
    meta data, content quality, backlinks, etc.
  `;

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
          .lightboxOverlay {
            display: none;
            position: fixed;
            top: 0; 
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
          }
          .lightboxContent {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 80%;
          }
          .closeLightbox {
            float: right;
            cursor: pointer;
            color: #007BFF;
            font-weight: bold;
          }
          .closeLightbox:hover {
            text-decoration: underline;
          }
          .score-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
          }
          .question-mark {
            background: #007BFF;
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-weight: bold;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis 🔎</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <div class="score-container">
            <p>Score: <span class="score">${score}/10</span></p>
            <button class="question-mark" id="openLightbox">?</button>
          </div>
          
          <div class="sections" id="initialSections">
            <h2>What's OK (exactly 10)</h2>
            <ul id="goodPoints">
              ${goodList}
            </ul>
            <h2>Needs to be addressed (exactly 20)</h2>
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

        <!-- Lightbox Overlay for score explanation -->
        <div class="lightboxOverlay" id="lightboxOverlay">
          <div class="lightboxContent" id="lightboxContent">
            <span class="closeLightbox" id="closeLightbox">Close ✖</span>
            <h2>Scoring Explanation</h2>
            <p>${explanationText}</p>
          </div>
        </div>

        <!-- We'll embed the badPoints as JSON for the final report. -->
        <script id="badPointsJson" type="application/json">
          ${JSON.stringify(badPoints)}
        </script>

        <script>
          const getReportBtn = document.getElementById('getReportBtn');
          const userName = document.getElementById('userName');
          const userEmail = document.getElementById('userEmail');
          const userCompany = document.getElementById('userCompany');

          const initialSections = document.getElementById('initialSections');
          const detailedReportSection = document.getElementById('detailedReportSection');
          const detailedList = document.getElementById('detailedList');

          const overlay = document.getElementById('lightboxOverlay');
          const closeBtn = document.getElementById('closeLightbox');
          const openBtn = document.getElementById('openLightbox');

          // Show/hide lightbox
          openBtn.addEventListener('click', () => {
            overlay.style.display = 'block';
          });
          closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
          });

          // Generate the final 10 detailed items from the badPoints
          function generateDetailedExplanations(points) {
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
            // Hide the initialSections
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
 *  - a fixed SEO score of 7/10
 *  - EXACTLY 10 “good” bullet points
 *  - EXACTLY 20 “needed to be addressed” bullet points
 *  - a form for name/email/company
 *  - once user enters name & email, hides the initial lists and shows up to 10 detailed items
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

    // Use fixed score of 7
    const score = getFixedSeoScore();

    // EXACT 10 good points, EXACT 20 bad points
    const goodPoints = getGoodPoints();
    const badPoints = getBadPoints();

    const htmlContent = buildHtmlResponse(normalizedUrl, score, goodPoints, badPoints);
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

/**
 * (Optional) POST /report
 * Accepts JSON with { url, name, email, company } if needed for more logic
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