const form = document.getElementById('url-form');
const input = document.getElementById('url-input');
const scoreEl = document.getElementById('score');
const superEl = document.getElementById('superpowers');
const oppEl = document.getElementById('opportunities');
const rawEl = document.getElementById('raw-json');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const url = encodeURIComponent(input.value.trim());
  scoreEl.textContent = 'Loading…';
  superEl.textContent = '';
  oppEl.textContent = '';
  rawEl.textContent = '';

  try {
    const res = await fetch(`/friendly?type=summary&url=${url}`);
    const data = await res.json();

    // Display score
    scoreEl.textContent = `Score: ${data.score ?? 'N/A'}`;

    // Display strengths
    if (data.ai_superpowers && typeof data.ai_superpowers === 'object') {
      superEl.innerHTML = '<h2>Superpowers</h2>' +
        Object.entries(data.ai_superpowers)
          .map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`)
          .join('');
    }

    // Display opportunities
    if (data.ai_opportunities && typeof data.ai_opportunities === 'object') {
      oppEl.innerHTML = '<h2>Opportunities</h2>' +
        Object.entries(data.ai_opportunities)
          .map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`)
          .join('');
    }

    // Raw output
    rawEl.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    scoreEl.textContent = 'Error fetching data';
    rawEl.textContent = err.toString();
  }
});