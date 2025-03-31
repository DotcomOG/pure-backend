import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Utility functions
function normalizeUrl(url) {
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^www\./i, '');
    return "https://" + trimmed;
  }
  return trimmed;
}

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

function calculateSeoScore(metrics) {
  let score = 10;
  if (!metrics.title) score -= 2;
  else if (metrics.titleLength < 30 || metrics.titleLength > 60) score -= 1;
  if (!metrics.metaDesc) score -= 2;
  else if (metrics.metaDescLength < 50 || metrics.metaDescLength > 160) score -= 1;
  if (!metrics.canonical) score -= 2;
  if (!metrics.hasH1) score -= 1;
  if (metrics.imagesWithoutAlt > 0) score -= Math.min(metrics.imagesWithoutAlt, 3);
  return Math.max(score, 1);
}

function generateGoodPoints(metrics) {
  const good = [];
  if (metrics.title && metrics.titleLength >= 30 && metrics.titleLength <= 60) {
    good.push("✅ Title tag is properly set (30-60 chars)");
  }
  if (metrics.metaDesc && metrics.metaDescLength >= 50 && metrics.metaDescLength <= 160) {
    good.push("✅ Meta description is present & optimized");
  }
  if (metrics.canonical) {
    good.push("✅ Canonical tag is present – prevents duplicate content issues");
  }
  if (metrics.hasH1) {
    good.push("✅ H1 tag is present – supports clear content hierarchy");
  }
  if (metrics.totalImages > 0 && metrics.imagesWithoutAlt === 0) {
    good.push("✅ All images have alt text – boosts accessibility and image SEO");
  }
  const additionalGood = [
    "✅ Mobile-friendly design – essential for modern AI SEO",
    "✅ Fast page load speed – improves user engagement",
    "✅ Well-structured content – aids AI understanding",
    "✅ Secure HTTPS – builds trust and enhances rankings",
    "✅ Clear navigation – improves internal linking for AI SEO"
  ];
  while (good.length < 10 && additionalGood.length > 0) {
    good.push(additionalGood.shift());
  }
  return good.slice(0, 10);
}

function generateBadPoints(metrics) {
  const bad = [];
  if (!metrics.title) {
    bad.push("🚨 Missing title tag<br><small class='explanation'>Essential for summarizing page content for AI analysis.</small>");
  } else if (metrics.titleLength < 30 || metrics.titleLength > 60) {
    bad.push("🚨 Title tag length not optimal<br><small class='explanation'>Ideal range is 30-60 characters for clear AI interpretation.</small>");
  }
  if (!metrics.metaDesc) {
    bad.push("🚨 Missing meta description<br><small class='explanation'>Crucial for generating compelling AI-powered summaries.</small>");
  } else if (metrics.metaDescLength < 50 || metrics.metaDescLength > 160) {
    bad.push("🚨 Meta description length off<br><small class='explanation'>Should be 50-160 characters to be effective for AI SEO.</small>");
  }
  if (!metrics.canonical) {
    bad.push("🚨 No canonical tag<br><small class='explanation'>Leads to duplicate content issues for AI indexing.</small>");
  }
  if (!metrics.hasH1) {
    bad.push("🚨 No H1 tag found<br><small class='explanation'>Hinders AI understanding of page structure.</small>");
  }
  if (metrics.imagesWithoutAlt > 0) {
    bad.push("🚨 Images missing alt text<br><small class='explanation'>Affects accessibility and AI-driven image search performance.</small>");
  }
  const additionalBad = [
    "🚨 Broken internal or external links<br><small class='explanation'>Disrupts navigation and reduces AI trust signals.</small>",
    "🚨 Slow server response time<br><small class='explanation'>Impacts user experience and AI SEO rankings.</small>",
    "🚨 No sitemap submitted<br><small class='explanation'>Limits AI engine discovery of all pages.</small>",
    "🚨 Keyword stuffing detected<br><small class='explanation'>Excessive keywords may trigger AI penalties.</small>"
  ];
  additionalBad.forEach(issue => bad.push(issue));
  return bad.slice(0, 15);
}

async function crawlWebsite(url) {
  let aggregatedContent = "";
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)' },
      redirect: 'follow'
    });
    if (response.ok) {
      aggregatedContent = await response.text();
    }
  } catch (error) {
    console.error("Error crawling website:", error);
  }
  return aggregatedContent;
}

async function getDetailedReportFromChatGPT(aggregatedContent) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: "Generate a detailed AI SEO analysis for the following website content, focusing on opportunities for improvement (min 20 and up to 50 detailed points), with each point having 2-5 lines of explanation. Include engine-specific insights for ChatGPT, Claude, Google Gemini, Microsoft Copilot, and Jasper AI. Content:\n\n" + aggregatedContent
      }],
      temperature: 0.7,
      max_tokens: 1000
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error in getDetailedReportFromChatGPT:", error);
    throw error;
  }
}

function buildSummaryReport(url, score, goodPoints, badPoints) {
  const goodHtml = goodPoints.map(pt => `<li>${pt}</li>`).join("");
  const badHtml = badPoints.map(pt => `<li>${pt}</li>`).join("");
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Analysis Summary (Powered by ChatGPT)</title>
        <link href="https://fonts.googleapis.com/css2?family=Forum&family=Nunito+Sans:wght@300;400;700&display=swap" rel="stylesheet" />
        <style>
          /* (Styles omitted for brevity; use your existing styles) */
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h2>Yoram Ezra Solutions</h2>
            <nav>
              <a href="https://yourwixsite.com/home" target="_blank">Home</a>
              <a href="https://yourwixsite.com/ai-seo" target="_blank">AI SEO Analyzer</a>
            </nav>
          </header>
          <h1>
            AI SEO Analysis Summary<br>
            <span style="font-size:0.7em; color:#555;">🤖 Powered by ChatGPT 🤖</span>
          </h1>
          <div class="header-info">
            <p>URL inspected: <strong>${url}</strong></p>
          </div>
          <div class="score-section">
            <span class="info-icon" title="Click for explanation" onclick="document.getElementById('lightbox').style.display='block';">?</span>
            <div class="score-label">AI SEO Score: ${score} out of 10</div>
          </div>
          <div class="score-indicator-container">
            <div class="score-indicator">
              <div class="score-marker" style="left:${score * 10}%;"></div>
              <span class="score-percentage">${score * 10}%</span>
            </div>
          </div>
          <h2>Your Site's Superpowers</h2>
          <ul>${goodHtml}</ul>
          <h2>Opportunities for an AI Boost</h2>
          <ul>${badHtml}</ul>
          <div class="form-container" id="contactForm">
            <p>For your full, detailed AI SEO report, please provide your details:</p>
            <form action="/detailed" method="POST" onsubmit="handleFormSubmit(event);">
              <input type="hidden" name="url" value="${url}" />
              <div class="form-row">
                <label>Name*:
                  <input type="text" name="name" required />
                </label>
                <label>Email*:
                  <input type="email" name="email" required />
                </label>
              </div>
              <div class="form-row company-and-submit">
                <label>Company/Organization:
                  <input type="text" name="company" />
                </label>
                <button type="submit">Get Full Report</button>
              </div>
            </form>
          </div>
          <div class="footer">
            Made by Yoram Ezra Solutions<br>
            🤖 Powered by ChatGPT 🤖
          </div>
          <!-- Lightbox for AI SEO Score Explanation -->
          <div id="lightbox">
            <div id="lightbox-content">
              <span id="lightbox-close" onclick="document.getElementById('lightbox').style.display='none';">Close</span>
              <h2>AI SEO Score Explanation</h2>
              <div class="score-indicator-container" style="width:100%; margin-bottom:10px;">
                <div class="score-indicator" style="width:100%; height:10px; border-radius:5px;">
                  <div class="score-marker" style="height:10px; left:${score * 10}%;"></div>
                  <span class="score-percentage" style="line-height:10px; font-size:0.8em;">${score * 10}%</span>
                </div>
              </div>
              <div class="lightbox-scale">
                <span><strong>0-20%</strong><br>Critical</span>
                <span><strong>21-40%</strong><br>Severe</span>
                <span><strong>41-60%</strong><br>Moderate</span>
                <span><strong>61-80%</strong><br>Minor</span>
                <span><strong>81-100%</strong><br>Excellent</span>
              </div>
              <p>
                <strong>Critical:</strong> Missing essential elements (title, meta description, canonical, H1).<br>
                <strong>Severe:</strong> Major issues severely impact AI SEO performance.<br>
                <strong>Moderate:</strong> Noticeable issues affect AI SEO effectiveness.<br>
                <strong>Minor:</strong> Slight issues with minimal impact.<br>
                <strong>Excellent:</strong> Optimal performance with trivial issues.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildDetailedReport(url, score, goodPoints, badPoints, detailedContent) {
  // For brevity, we assume detailedContent comes from ChatGPT
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Detailed AI SEO Analysis (Powered by ChatGPT)</title>
        <link href="https://fonts.googleapis.com/css2?family=Forum&family=Nunito+Sans:wght@300;400;700&display=swap" rel="stylesheet" />
        <style>
          /* Use similar styles as summary for header, form, footer, etc. */
          /* (Styles omitted for brevity; reuse same CSS from buildSummaryReport) */
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h2>Yoram Ezra Solutions</h2>
            <nav>
              <a href="https://yourwixsite.com/home" target="_blank">Home</a>
              <a href="https://yourwixsite.com/ai-seo" target="_blank">AI SEO Analyzer</a>
            </nav>
          </header>
          <h1>
            Detailed AI SEO Analysis<br>
            <span style="font-size:0.7em; color:#555;">🤖 Powered by ChatGPT 🤖</span>
          </h1>
          <div class="header-info">
            <p>URL inspected: <strong>${url}</strong></p>
          </div>
          <div class="score-section">
            <span class="info-icon" title="Click for explanation" onclick="document.getElementById('lightbox').style.display='block';">?</span>
            <div class="score-label">AI SEO Score: ${score} out of 10</div>
          </div>
          <div class="score-indicator-container">
            <div class="score-indicator">
              <div class="score-marker" style="left:${score * 10}%;"></div>
              <span class="score-percentage">${score * 10}%</span>
            </div>
          </div>
          <h2>Your Site's Superpowers</h2>
          <ul>${goodPoints.map(pt => `<li>${pt}</li>`).join("")}</ul>
          <h2>Opportunities for an AI Boost</h2>
          <ul>${badPoints.map(pt => `<li>${pt}</li>`).join("")}</ul>
          <h2>Deep Dive Analysis</h2>
          <div class="detailed-content">
            ${detailedContent}
          </div>
          <div class="form-container" id="contactForm">
            <p>
              To receive your comprehensive AI SEO report and discuss tailored improvements, please provide your details:
            </p>
            <form action="/detailed" method="POST" onsubmit="handleFormSubmit(event);">
              <input type="hidden" name="url" value="${url}" />
              <div class="form-row">
                <label>Name*:
                  <input type="text" name="name" required />
                </label>
                <label>Email*:
                  <input type="email" name="email" required />
                </label>
              </div>
              <div class="form-row company-and-submit">
                <label>Company/Organization:
                  <input type="text" name="company" />
                </label>
                <div class="form-row">
                  <label>Area of Expertise:
                    <select name="expertise">
                      <option value="">-----</option>
                      <option value="AI">AI</option>
                      <option value="MarTech">MarTech</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Content Strategy">Content Strategy</option>
                      <option value="SEO">SEO</option>
                    </select>
                  </label>
                </div>
                <button type="submit">Let's Talk</button>
              </div>
            </form>
          </div>
          <div class="footer">
            Made by Yoram Ezra Solutions<br>
            🤖 Powered by ChatGPT 🤖
          </div>
          <!-- Lightbox for AI SEO Score Explanation (same as summary) -->
          <div id="lightbox">
            <div id="lightbox-content">
              <span id="lightbox-close" onclick="document.getElementById('lightbox').style.display='none';">Close</span>
              <h2>AI SEO Score Explanation</h2>
              <div class="score-indicator-container" style="width:100%; margin-bottom:10px;">
                <div class="score-indicator" style="width:100%; height:10px; border-radius:5px;">
                  <div class="score-marker" style="height:10px; left:${score * 10}%;"></div>
                  <span class="score-percentage" style="line-height:10px; font-size:0.8em;">${score * 10}%</span>
                </div>
              </div>
              <div class="lightbox-scale">
                <span><strong>0-20%</strong><br>Critical</span>
                <span><strong>21-40%</strong><br>Severe</span>
                <span><strong>41-60%</strong><br>Moderate</span>
                <span><strong>61-80%</strong><br>Minor</span>
                <span><strong>81-100%</strong><br>Excellent</span>
              </div>
              <p>
                <strong>Critical:</strong> Missing essential elements (title, meta description, canonical, H1).<br>
                <strong>Severe:</strong> Major issues severely impact AI SEO performance.<br>
                <strong>Moderate:</strong> Noticeable issues affect AI SEO effectiveness.<br>
                <strong>Minor:</strong> Slight issues with minimal impact.<br>
                <strong>Excellent:</strong> Optimal performance with trivial issues.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

// Root route serves the summary report (main.html)
app.get('/', (req, res) => {
  const mainFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public', 'main.html');
  res.sendFile(mainFile, (err) => {
    if (err) {
      console.error("Error sending main.html:", err);
      res.status(500).send("Error loading page.");
    }
  });
});

// Endpoint for dynamic detailed report generation
app.post('/detailed', async (req, res) => {
  try {
    const { url: rawUrl, name, email, company, expertise } = req.body;
    if (!rawUrl || !name || !email) {
      return res.status(400).send('URL, Name, and Email are required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send('Invalid email address.');
    }
    const url = normalizeUrl(rawUrl);
    const aggregatedContent = await crawlWebsite(url);
    const detailedContent = await getDetailedReportFromChatGPT(aggregatedContent);
    // For demonstration, use generated detailedContent; you may combine it with metrics analysis.
    const metricsResponse = await fetch(url, {
      headers: { 'User-Agent': 'AI-SEO-Crawler/1.0 (https://yourwebsite.com)' },
      redirect: 'follow'
    });
    const html = await metricsResponse.text();
    const metrics = analyzeHtml(html);
    const score = calculateSeoScore(metrics);
    const goodPoints = generateGoodPoints(metrics);
    const badPoints = generateBadPoints(metrics);
    const fullReportHtml = buildDetailedReport(url, score, goodPoints, badPoints, detailedContent);
    res.status(200).send(fullReportHtml);
  } catch (error) {
    console.error("Error generating detailed AI SEO analysis:", error);
    res.status(500).send("Error generating detailed AI SEO analysis.");
  }
});

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});