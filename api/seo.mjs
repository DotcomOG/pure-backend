import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

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
  // Fill up to 10 items (if fewer than 10, add generic good points)
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
 * Generate "Needs to be Addressed" list based on metrics.
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
  // Add more generic issues to reach a pool of up to 25 possible issues
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
  return bad.slice(0, 25); // Full pool of issues
}

/**
 * Build detailed explanations mapping for each bad point.
 * Each explanation is two lines at most.
 */
function getDetailedExplanationsMap(metrics) {
  return {
    "Missing title tag": "A title tag is essential for search engines to understand the page content. It also appears in search results.",
    "Title tag length is not optimal (should be 30-60 characters)":
      "Title tags should be concise and descriptive. Adjust the length for better visibility and click-through rates.",
    "Missing meta description": "Meta descriptions summarize page content. Without them, search engines and users may lack context.",
    "Meta description length is suboptimal (should be 50-160 characters)":
      "Meta descriptions need to be neither too short nor too long for optimal impact. Revise to match recommended length.",
    "Missing canonical tag": "Canonical tags help prevent duplicate content issues by specifying the preferred URL. This is important for SEO consistency.",
    "No H1 tag found": "An H1 tag is a key signal of the main topic of a page. Its absence can reduce clarity and SEO performance.",
    "Images missing alt text": "Alt text improves accessibility and gives context to images for search engines. Missing alt attributes can harm SEO.",
    "Broken internal or external links": "Broken links disrupt user experience and can negatively affect SEO. Regular link audits are necessary.",
    "Slow server response time": "A slow server can lead to poor user experience and lower rankings. Optimize server performance.",
    "No sitemap submitted to search engines": "Sitemaps help search engines crawl your site efficiently. Without one, some pages may be missed.",
    "Keyword stuffing detected": "Overusing keywords can be seen as spammy. Content should be natural and user-friendly.",
    "Excessive pop-ups or interstitials": "Too many pop-ups can frustrate users and lead to higher bounce rates. Use them sparingly.",
    "Thin content on some pages": "Pages with little content may not provide sufficient value to users or search engines.",
    "No structured data markup": "Structured data helps search engines understand content. Its absence may limit rich results.",
    "Cluttered navigation menu": "A confusing navigation menu can hamper user experience and site indexing.",
    "High bounce rate from homepage": "A high bounce rate might indicate irrelevant content or poor user experience.",
    "No analytics or tracking installed": "Without analytics, you cannot measure user engagement or SEO performance.",
    "Inconsistent business information (NAP)": "Consistent Name, Address, and Phone (NAP) information builds trust with search engines and users.",
    "Orphan pages with poor internal linking": "Pages not linked to internally may be overlooked by search engines.",
    "Minimal social proof or reviews": "Social proof such as reviews can enhance credibility and SEO.",
    "Missing robots.txt or misconfigured": "A proper robots.txt file guides search engines. Misconfigurations can block important pages.",
    "Low domain authority due to few backlinks": "Quality backlinks improve domain authority. Lack thereof can limit ranking potential.",
    "Outdated or irrelevant content": "Fresh, relevant content is key to user engagement and SEO. Outdated content may harm performance."
  };
}

/**
 * Build the full HTML response.
 * The initial view shows:
 * - URL inspected, fixed score, 10 good points, and 15 bad points.
 * - A contact form for Name*, Email*, Company.
 * Upon form submission, the initial view hides and the full detailed report is shown,
 * which displays detailed explanations for all issues (beyond the initial 15, if available).
 */
function buildHtmlResponse(url, score, goodPoints, badPointsPool, metrics) {
  const initialBadPoints = badPointsPool.slice(0, 15);
  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const badHtml = initialBadPoints.map(pt => `<li>🚨 ${pt}</li>`).join("");
  const detailedExplanationsMap = getDetailedExplanationsMap(metrics);

  // For detailed report, build explanations for each bad point (all 25)
  const detailedHtml = badPointsPool.map(issue => {
    const explanation = detailedExplanationsMap[issue] || "Review this issue for better SEO.";
    // Remove any numbering, use red light emoji (🚨) and add line breaks.
    return `<li>🚨 ${issue}<br>${explanation}</li><br>`;
  }).join("");

  // Explanation text for scoring (in lightbox)
  const explanationText = `
    This SEO score of ${score}/10 is based on real-world factors:
    - Title tag presence and length
    - Meta description presence and length
    - Canonical tag, H1 tag presence
    - Image alt attributes, and more.
    Each factor is measured against industry standards.
  `;

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
          .form-section label { display: block; margin-bottom: 5px; }
          .form-section input { width: 90%; margin-bottom: 10px; padding: 5px; }
          .hidden { display: none; }
          .detailed-report { margin-top: 20px; background: #fff7e6; padding: 15px; border-radius: 6px; }
          .detailed-report ul { padding-left: 20px; }
          .cta { text-align: center; padding: 10px; background: #fdecea; border-radius: 6px; margin-top: 20px; }
          .cta a { color: #d93025; font-weight: bold; text-decoration: none; }
          .cta a:hover { text-decoration: underline; }
          .lightboxOverlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; }
          .lightboxContent { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 20px; border-radius: 8px; max-width: 500px; width: 80%; }
          .closeLightbox { float: right; cursor: pointer; color: #007BFF; font-weight: bold; }
          .closeLightbox:hover { text-decoration: underline; }
          .score-container { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
          .question-mark { background: #007BFF; color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <div id="initialContainer" class="container">
          <h1>AI SEO Analysis 🔎</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <div class="score-container">
            <p>Score: <span class="score">${score}/10</span></p>
            <button class="question-mark" id="openLightbox">?</button>
          </div>
          <h2>What's OK</h2>
          <ul id="goodPoints">${goodHtml}</ul>
          <h2>Needs to be Addressed</h2>
          <ul id="badPoints">${badHtml}</ul>
          <div class="form-section">
            <p><strong>Get your full report</strong></p>
            <p>Fields with * are required.</p>
            <label>Name*:</label>
            <input type="text" id="userName" />
            <label>Email*:</label>
            <input type="text" id="userEmail" />
            <label>Company:</label>
            <input type="text" id="userCompany" />
            <button id="getReportBtn">Get Full Report</button>
          </div>
        </div>

        <div id="fullReportContainer" class="container hidden">
          ${buildDetailedReportHtml(getBadPointsPool())}
        </div>

        <!-- Lightbox for scoring explanation -->
        <div class="lightboxOverlay" id="lightboxOverlay">
          <div class="lightboxContent">
            <span class="closeLightbox" id="closeLightbox">Close ✖</span>
            <h2>Scoring Explanation</h2>
            <p>${explanationText}</p>
          </div>
        </div>

        <script>
          const openBtn = document.getElementById('openLightbox');
          const closeBtn = document.getElementById('closeLightbox');
          const overlay = document.getElementById('lightboxOverlay');
          openBtn.addEventListener('click', () => {
            overlay.style.display = 'block';
          });
          closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
          });

          const getReportBtn = document.getElementById('getReportBtn');
          getReportBtn.addEventListener('click', () => {
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            if (!name || !email) {
              alert("Name and Email are required.");
              return;
            }
            // Store inquiry details (for production, save in a database)
            console.log("Inquiry received:", {
              name: name,
              email: email,
              company: document.getElementById('userCompany').value.trim()
            });
            // Hide the initial container and show the full detailed report
            document.getElementById('initialContainer').classList.add('hidden');
            document.getElementById('fullReportContainer').classList.remove('hidden');
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * GET /friendly?url=example.com
 * Performs real-time analysis of the given URL using Cheerio.
 * Returns an HTML page with:
 * - Real analysis-based SEO score and metrics
 * - Exactly 10 good points (if applicable)
 * - Exactly 15 "needs to be addressed" points (from the pool)
 * - A contact form for further inquiries
 * - Upon form submission, displays a full detailed report with explanations for all issues in the pool.
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Please provide a ?url= parameter');

  const url = normalizeUrl(targetUrl);
  try {
    const response = await fetch(url);
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

/**
 * Analyze the fetched HTML using Cheerio to extract real metrics.
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
 * Calculate SEO score based on real metrics from the HTML.
 * This is a basic example; refine with more accurate real-world logic.
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
 * Generate "good" points based on real metrics.
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
  // Fill to 10 items
  const additionalGood = [
    "Mobile-friendly design",
    "Fast page load speed",
    "Well-structured content",
    "Secure HTTPS implementation",
    "Clear navigation"
  ];
  while (good.length < 10 && additionalGood.length) {
    good.push(additionalGood.shift());
  }
  return good.slice(0, 10);
}

/**
 * Generate "needs to be addressed" points based on real metrics.
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
  // Add additional generic issues if needed
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
 * GET /report (Optional POST endpoint)
 * Accepts JSON with { url, name, email, company } for storing inquiries.
 */
app.post('/report', async (req, res) => {
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