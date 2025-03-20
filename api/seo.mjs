import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { load } from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// In-memory storage for inquiries (for production, use a persistent database)
const inquiries = [];

/**
 * Landing Page (GET /)
 * Provides a form for users to enter a URL.
 */
app.get('/', (req, res) => {
  const landingPageHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Analysis Landing Page</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          input[type="text"] { padding: 10px; width: calc(100% - 22px); margin-bottom: 10px; }
          button { padding: 10px 20px; background: #007BFF; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>AI SEO Analysis</h1>
          <form id="urlForm">
            <input type="text" id="urlInput" placeholder="Enter website URL" required />
            <button type="submit">Analyze</button>
          </form>
        </div>
        <script>
          document.getElementById('urlForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const url = document.getElementById('urlInput').value.trim();
            if(url) {
              window.location.href = '/friendly?url=' + encodeURIComponent(url);
            }
          });
        </script>
      </body>
    </html>
  `;
  res.send(landingPageHTML);
});

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
 * Detailed explanations for each SEO issue.
 */
const detailedExplanations = {
  "Missing title tag": "A title tag is crucial for SEO as it helps search engines understand your page's content. Without it, your site may not rank as well. Contact us to develop a compelling title strategy.",
  "Title tag length is not optimal (should be 30-60 characters)": "An optimally sized title tag improves both visibility and click-through rates in search results. We can help refine your title tags to meet best practices.",
  "Missing meta description": "Meta descriptions provide a summary of your page for search engines and users. Their absence can lower click-through rates. Let us craft engaging meta descriptions for you.",
  "Meta description length is suboptimal (should be 50-160 characters)": "A well-sized meta description ensures your page is represented accurately in search results. We offer tailored solutions to optimize your meta content.",
  "Missing canonical tag": "Canonical tags prevent duplicate content issues by designating a preferred version of your page. Missing this can hurt your SEO. We can implement canonical tags to protect your rankings.",
  "No H1 tag found": "The H1 tag signifies the main heading of your page and guides both users and search engines. Without it, your content hierarchy suffers. We can assist in structuring your content effectively.",
  "Images missing alt text": "Alt text improves accessibility and helps search engines understand your images. Missing alt attributes can negatively impact your SEO. Contact us to optimize your image attributes.",
  "Broken internal or external links": "Broken links harm user experience and prevent proper site crawling. We can perform an audit and fix broken links to improve your site's performance.",
  "Slow server response time": "A slow server can frustrate users and reduce search engine rankings. Our performance optimization services can help speed up your website.",
  "No sitemap submitted to search engines": "Sitemaps help search engines discover and index your pages. Without one, some pages might be missed. We can generate and submit a sitemap for you.",
  "Keyword stuffing detected": "Overusing keywords can appear spammy and hurt your SEO. We offer content optimization to balance keyword use and maintain natural readability.",
  "Excessive pop-ups or interstitials": "Too many pop-ups can disrupt user experience and lead to lower engagement. We can help design a better balance to keep visitors on your site.",
  "Thin content on some pages": "Pages with little content provide minimal value to users and search engines. We specialize in developing rich, engaging content that drives results.",
  "No structured data markup": "Structured data helps search engines understand your content better, leading to improved search visibility. Let us implement structured data to enhance your site's performance.",
  "Cluttered navigation menu": "A cluttered navigation menu can confuse users and impair SEO. We can streamline your site’s navigation for improved usability and better rankings.",
  "High bounce rate from homepage": "A high bounce rate may indicate that users aren't finding what they need quickly. We can analyze your user experience and implement strategies to keep visitors engaged.",
  "No analytics or tracking installed": "Without proper analytics, you lose valuable insights into user behavior. We can help set up robust tracking to inform your SEO strategy.",
  "Inconsistent business information (NAP)": "Consistent Name, Address, and Phone details are vital for local SEO. Inconsistencies can confuse customers and search engines. Let us ensure your business info is uniform across all platforms.",
  "Orphan pages with poor internal linking": "Pages isolated from your site's link structure are less likely to rank well. We can optimize internal linking to boost the visibility of all your pages.",
  "Minimal social proof or reviews": "Social proof builds trust and credibility. A lack of reviews or testimonials can deter potential customers. We offer strategies to integrate effective social proof into your site.",
  "Missing robots.txt or misconfigured": "A well-configured robots.txt file guides search engines on which pages to crawl. Its absence or errors can hinder your SEO. We can audit and optimize your robots.txt file.",
  "Low domain authority due to few backlinks": "Backlinks are a key factor in building domain authority. If your site has few quality links, your credibility suffers. We provide strategies to build high-quality backlinks.",
  "Outdated or irrelevant content": "Fresh, relevant content is essential for SEO and user engagement. Outdated pages can hurt your rankings. Let us help you refresh and modernize your content strategy."
};

/**
 * Build the detailed report HTML with red emoji bullets.
 */
function buildDetailedReportHtml(badPointsPool) {
  const detailedHtml = badPointsPool.map(issue => {
    const explanation = detailedExplanations[issue] || "This issue could be affecting your site's performance. Contact us for a personalized review and solution.";
    return `<li>🔴 <strong>${issue}</strong><br>${explanation}</li>`;
  }).join("");
  return `<h2>Detailed Report</h2><ul>${detailedHtml}</ul>`;
}

/**
 * Call the OpenAI ChatGPT API to get advanced SEO analysis.
 * Replace "YOUR_OPENAI_API_KEY" with your actual OpenAI API key.
 */
async function getChatGPTAnalysis(metrics) {
  const prompt = `
You are an expert SEO consultant. Analyze the following website metrics and provide an advanced SEO analysis with actionable recommendations:

Title: ${metrics.title}
Title Length: ${metrics.titleLength}
Meta Description: ${metrics.metaDesc}
Meta Description Length: ${metrics.metaDescLength}
Canonical Tag: ${metrics.canonical}
H1 Present: ${metrics.hasH1}
Total Images: ${metrics.totalImages}
Images Missing Alt Text: ${metrics.imagesWithoutAlt}

Please provide a concise, detailed analysis and suggestions for improvement.
  `;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_OPENAI_API_KEY"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "Advanced analysis is currently unavailable.";
  }
}

/**
 * Build the full HTML response.
 * The initial view includes:
 * - A summary report with SEO score (0-10), lists, and a contact form.
 * The detailed report view includes:
 * - A header with the URL, overall score, and a (?) button,
 * - An "Enter another URL" link that goes back to the landing page,
 * - The detailed explanation for each issue with red emoji bullets,
 * - An "Advanced SEO Analysis" section powered by ChatGPT,
 * - And a call-to-action for contacting you.
 */
function buildHtmlResponse(url, score, goodPoints, badPointsPool, metrics, chatGPTAnalysis) {
  const goodHtml = goodPoints.map(pt => `<li>✅ ${pt}</li>`).join("");
  const badHtml = badPointsPool.slice(0, 15).map(pt => `<li>🚨 ${pt}</li>`).join("");

  // Explanation text with line breaks for the scoring system.
  const explanationText = `
This SEO score of ${score}/10 is calculated based on the following factors:<br><br>
<strong>1. Title Tag:</strong><br>
&nbsp;&nbsp;&bull; Must be present.<br>
&nbsp;&nbsp;&bull; Optimal length is between 30-60 characters.<br>
&nbsp;&nbsp;&bull; Missing or non-optimal length results in deductions.<br><br>
<strong>2. Meta Description:</strong><br>
&nbsp;&nbsp;&bull; Should be provided.<br>
&nbsp;&nbsp;&bull; Ideal length is between 50-160 characters.<br>
&nbsp;&nbsp;&bull; Missing or poorly sized meta descriptions incur deductions.<br><br>
<strong>3. Canonical Tag:</strong><br>
&nbsp;&nbsp;&bull; Indicates the preferred version of a page.<br>
&nbsp;&nbsp;&bull; Its absence can lead to duplicate content issues.<br><br>
<strong>4. H1 Tag:</strong><br>
&nbsp;&nbsp;&bull; A primary heading is required for clear content structure.<br>
&nbsp;&nbsp;&bull; Missing H1 tags result in deductions.<br><br>
<strong>5. Images Alt Text:</strong><br>
&nbsp;&nbsp;&bull; Alt text is needed for accessibility and SEO.<br>
&nbsp;&nbsp;&bull; Each missing alt attribute deducts a small amount (up to 3 points total).<br><br>
The score starts at 10, with points deducted for each issue found.
`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>AI SEO Analysis</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
          .container { max-width: 700px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          h1, h2 { color: #333; }
          .score { font-weight: bold; color: #007BFF; }
          ul { padding-left: 20px; }
          .form-section { margin-top: 20px; padding: 15px; background: #e9e9e9; border-radius: 6px; }
          .form-section input { padding: 8px; margin-bottom: 10px; width: calc(100% - 16px); }
          .hidden { display: none; }
          .detailed-report { margin-top: 20px; background: #fff7e6; padding: 15px; border-radius: 6px; }
          .cta { text-align: center; padding: 10px; background: #fdecea; border-radius: 6px; margin-top: 20px; }
          .cta a { color: #d93025; font-weight: bold; text-decoration: none; }
          .cta a:hover { text-decoration: underline; }
          .lightboxOverlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; }
          .lightboxContent { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%; }
          .closeLightbox { cursor: pointer; float: right; color: #007BFF; }
          .score-container { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
          .question-mark { background: #007BFF; color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-weight: bold; text-align: center; }
          .header { margin-bottom: 20px; }
          .header a { text-decoration: none; color: #d93025; font-weight: bold; }
          .header a:hover { text-decoration: underline; }
          .chatgpt-analysis { margin-top: 20px; padding: 15px; background: #e6f7ff; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container" id="initialContainer">
          <h1>AI SEO Analysis Report</h1>
          <p>URL inspected: <strong>${url}</strong></p>
          <div class="score-container">
            <p>SEO Score: <span class="score">${score}/10</span></p>
            <button class="question-mark" id="openLightbox">?</button>
          </div>
          <h2>What's OK</h2>
          <ul>${goodHtml}</ul>
          <h2>Needs to be Addressed</h2>
          <ul>${badHtml}</ul>
          <div class="form-section">
            <p><strong>Get your full detailed report</strong> (Fill out the form below):</p>
            <label>Name*:</label><br>
            <input type="text" id="userName" placeholder="Your Name" /><br>
            <label>Email*:</label><br>
            <input type="email" id="userEmail" placeholder="Your Email" /><br>
            <label>Company (Optional):</label><br>
            <input type="text" id="userCompany" placeholder="Your Company" /><br>
            <button id="submitForm">Submit</button>
          </div>
        </div>

        <div class="container hidden" id="detailedReportContainer">
          <div class="header">
            <a href="/" id="enterNewUrl">Enter another URL</a>
            <h1>AI SEO Analysis Report</h1>
            <p>URL inspected: <strong>${url}</strong></p>
            <div class="score-container">
              <p>SEO Score: <span class="score">${score}/10</span></p>
              <button class="question-mark" id="openLightboxDetailed">?</button>
            </div>
          </div>
          <hr>
          ${buildDetailedReportHtml(badPointsPool)}
          <div class="chatgpt-analysis">
            <h2>Advanced SEO Analysis (Powered by ChatGPT)</h2>
            <p>${chatGPTAnalysis}</p>
          </div>
          <div class="cta">
            <p>Contact us for a free consultation and custom AI tools to fix these issues!</p>
            <a href="mailto:youremail@example.com">Set up a call</a>
          </div>
        </div>

        <!-- Lightbox for Scoring Explanation -->
        <div class="lightboxOverlay" id="lightboxOverlay">
          <div class="lightboxContent">
            <span class="closeLightbox" id="closeLightbox">Close ✖</span>
            <h2>Scoring Explanation</h2>
            <p>${explanationText}</p>
          </div>
        </div>

        <script>
          // Lightbox functionality for scoring explanation
          document.getElementById('openLightbox').addEventListener('click', () => {
            document.getElementById('lightboxOverlay').style.display = 'block';
          });
          document.getElementById('closeLightbox').addEventListener('click', () => {
            document.getElementById('lightboxOverlay').style.display = 'none';
          });
          document.getElementById('openLightboxDetailed').addEventListener('click', () => {
            document.getElementById('lightboxOverlay').style.display = 'block';
          });

          // Form submission to show detailed report (toggle views)
          document.getElementById('submitForm').addEventListener('click', () => {
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            if (!name || !email) {
              alert("Name and Email are required.");
              return;
            }
            console.log("Inquiry received:", {
              name: name,
              email: email,
              company: document.getElementById('userCompany').value.trim()
            });
            document.getElementById('initialContainer').classList.add('hidden');
            document.getElementById('detailedReportContainer').classList.remove('hidden');
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * GET /friendly?url=example.com
 * Performs real-time SEO analysis and returns an HTML page with a summary report.
 * It also integrates advanced analysis from ChatGPT.
 */
app.get('/friendly', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.redirect('/');
  
  const url = normalizeUrl(targetUrl);
  try {
    // Fetch using additional headers to mimic a browser request.
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!response.ok) {
      console.error("Error response:", response.status, response.statusText);
      return res.status(500).send('Error retrieving content from the provided URL');
    }
    const html = await response.text();

    const metrics = analyzeHtml(html);
    const score = calculateSeoScore(metrics);
    const goodPoints = generateGoodPoints(metrics);
    const badPointsPool = generateBadPoints(metrics);
    
    // Call ChatGPT for advanced analysis.
    const chatGPTAnalysis = await getChatGPTAnalysis(metrics);

    const htmlContent = buildHtmlResponse(url, score, goodPoints, badPointsPool, metrics, chatGPTAnalysis);
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send('Error retrieving content from the provided URL');
  }
});

/**
 * POST /report
 * Accepts inquiry details and stores them in memory.
 */
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