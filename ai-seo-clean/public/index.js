// Last updated: 2025-04-23 16:30 ET

// 1. Point directly at your Render backend (no trailing slash)
const BACKEND_URL = 'https://ai-seo-backend-final.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  let summaryData;
  const ui = {
    urlBox:      document.getElementById('url-lightbox'),
    urlInput:    document.getElementById('urlInput'),
    analyzeBtn:  document.getElementById('analyzeButton'),
    waitingMsg:  document.getElementById('waiting-message'),
    inspected:   document.getElementById('inspected-url'),
    errorMsg:    document.getElementById('errorMsg'),
    scoreMkr:    document.getElementById('score-marker'),
    scorePct:    document.getElementById('score-percentage'),
    superList:   document.getElementById('superpowers-list'),
    oppList:     document.getElementById('opportunities-list'),
    insightList: document.getElementById('engine-insights-list'),
    summaryForm: document.getElementById('summaryForm'),
    infoIcon:    document.getElementById('infoIcon'),
    scoreBox:    document.getElementById('score-lightbox'),
    scoreClose:  document.getElementById('score-lightbox-close')
  };

  function renderSummary() {
    ui.waitingMsg.style.display = 'none';
    ui.scoreMkr.style.animation = 'none';
    ui.scoreMkr.style.left      = summaryData.score + '%';
    ui.scorePct.textContent     = summaryData.score + '%';

    ui.superList.innerHTML = summaryData.ai_superpowers
      .map(i => `<li><div class="title">✅ ${i.title}</div><div class="explanation">${i.explanation}</div></li>`)
      .join('');

    ui.oppList.innerHTML = summaryData.ai_opportunities
      .map(i => `<li><div class="title">🚨 ${i.title}</div><div class="explanation">${i.explanation}</div></li>`)
      .join('');

    ui.insightList.innerHTML = Object.entries(summaryData.ai_engine_insights)
      .map(([eng, txt]) => `<li><div class="title">🤖 ${eng}</div><div class="explanation">${txt}</div></li>`)
      .join('');
  }

  async function analyzeURL() {
    ui.errorMsg.textContent = '';
    ui.waitingMsg.style.display = 'block';

    const raw = ui.urlInput.value.trim();
    if (!raw) {
      ui.errorMsg.textContent = 'Please enter a URL.';
      ui.waitingMsg.style.display = 'none';
      return;
    }
    const url = raw.match(/^(https?:\/\/)/i) ? raw : 'https://' + raw;
    ui.inspected.textContent = url;
    ui.urlBox.style.display  = 'none';

    // 2. Build the absolute endpoint URL
    const endpoint = `${BACKEND_URL}/friendly?type=summary&url=${encodeURIComponent(url)}`;
    console.log('🛰️ Fetching summary from:', endpoint);

    try {
      const res = await fetch(endpoint, { mode: 'cors', redirect: 'follow' });
      console.log('⌛ Status:', res.status);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server ${res.status}`);
      }
      summaryData = await res.json();
      renderSummary();
    } catch (err) {
      ui.waitingMsg.style.display = 'none';
      ui.errorMsg.textContent = `Error fetching summary: ${err.message}`;
      console.error(err);
    }
  }

  ui.analyzeBtn.addEventListener('click',  analyzeURL);
  ui.urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') analyzeURL(); });

  ui.summaryForm.addEventListener('submit', e => {
    e.preventDefault();
    localStorage.setItem('userName',    e.target.name.value.trim());
    localStorage.setItem('userEmail',   e.target.email.value.trim());
    localStorage.setItem('userCompany', e.target.company.value.trim());
    window.location.href = `/full-report.html?url=${encodeURIComponent(ui.inspected.textContent)}`;
  });

  ui.infoIcon.addEventListener('click',      () => ui.scoreBox.style.display = 'flex');
  ui.scoreClose.addEventListener('click',    () => ui.scoreBox.style.display = 'none');
});