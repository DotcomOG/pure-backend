// Last updated: 2025-04-23 16:30 ET

const BACKEND_URL = 'https://ai-seo-backend-final.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const url    = params.get('url');
  document.getElementById('report-url').textContent = url;

  // Pre-fill form from localStorage
  document.getElementById('fullName').value    = localStorage.getItem('userName')    || '';
  document.getElementById('fullEmail').value   = localStorage.getItem('userEmail')   || '';
  document.getElementById('fullCompany').value = localStorage.getItem('userCompany') || '';

  // Build & log the endpoint
  const endpoint = `${BACKEND_URL}/friendly?type=full&url=${encodeURIComponent(url)}`;
  console.log('🛰️ Fetching full report from:', endpoint);

  try {
    const res = await fetch(endpoint, { mode: 'cors', redirect: 'follow' });
    console.log('⌛ Status:', res.status);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `Server ${res.status}`);
    }
    const data = await res.json();

    document.getElementById('report-score').textContent = data.score + '%';

    const render = (id, items, emoji) => {
      document.getElementById(id).innerHTML = items.map(i =>
        `<li><div class="title">${emoji} ${i.title}</div><div class="explanation">${i.explanation}</div></li>`
      ).join('');
    };

    render('full-superpowers',   data.ai_superpowers,   '✅');
    render('full-opportunities', data.ai_opportunities, '🚨');
    render('full-insights',
           Object.entries(data.ai_engine_insights).map(([e,t])=>({title:e,explanation:t})),
           '🤖');

    localStorage.setItem('fullData', JSON.stringify(data));
  } catch (err) {
    document.getElementById('errorReport').textContent = `Error loading report: ${err.message}`;
    console.error(err);
  }

  document.getElementById('fullReportForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name    = document.getElementById('fullName').value.trim();
    const email   = document.getElementById('fullEmail').value.trim();
    const company = document.getElementById('fullCompany').value.trim();
    const data    = JSON.parse(localStorage.getItem('fullData')||'{}');

    await firebase.firestore().collection('reports').add({
      name, email, company, url, fullReport: data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('errorReport').style.color = 'green';
    document.getElementById('errorReport').textContent = '✅ Saved!';
  });
});