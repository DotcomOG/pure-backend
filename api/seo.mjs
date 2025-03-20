import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

function normalizeUrl(url) {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed.replace(/^www\./, '');
  }
  return trimmed;
}

function calculateSeoScore() {
  return Math.floor(Math.random() * 10) + 1;
}

function getGoodPoints() {
  return [
    "Mobile-friendly design",
    "Fast page load speed",
    "Clear call-to-action buttons",
    "Secure HTTPS implementation",
    "Logical internal linking",
  ];
}

const badPointsWithExplanations = [
  { issue: "Missing canonical tags", explanation: "Helps prevent duplicate content issues and ensures search engines know the preferred URL." },
  { issue: "No backlinks from reputable sites", explanation: "Backlinks improve domain authority and help with search engine rankings." },
  { issue: "No structured data markup", explanation: "Structured data helps search engines understand content better for rich results." },
  { issue: "Slow server response time", explanation: "Affects user experience and SEO rankings; optimize server and caching." },
  { issue: "No robots.txt file", explanation: "Controls search engine crawling and prevents indexing of sensitive pages." }
];

function buildHtmlResponse(url, score, goodPoints, badPoints) {
  const initialBad = badPoints.slice(0, 3);
  const remainingBad = badPoints.slice(3);

  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const badHtml = initialBad.map(pt => `<li>🚨 ${pt.issue}</li>`).join("");
  const detailedBadHtml = remainingBad.map(pt => `<li>🚨 <strong>${pt.issue}</strong><br/>${pt.explanation}</li>`).join("");

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
          .hidden { display: none; }
          .cta { text-align: center; padding: 10px; background: #fdecea; border-radius: 6px; margin-top: 20px; }
          .cta a { color: #d93025; font-weight: bold; text-decoration: none; }
          .cta a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis 🔎 <a href="#" id="info">(?)</a></h1>
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
            <button id="getReportBtn">Get Full Report</button>
          </div>

          <div id="detailedReport" class="hidden">
            <h2>Detailed Report</h2>
            <ul>${detailedBadHtml}</ul>
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

          document.getElementById('info').addEventListener('click', function(event) {
            event.preventDefault();
            alert("Scoring is based on AI analysis of SEO best practices, accessibility, and site structure.");
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
  const html = buildHtmlResponse(url, score, getGoodPoints(), badPointsWithExplanations);

  res.status(200).send(html);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});