// public/index.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const scoreEl = document.getElementById('score');
  const supEl = document.getElementById('superpowers');
  const oppEl = document.getElementById('opportunities');
  const rawEl = document.getElementById('raw-json');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = encodeURIComponent(input.value.trim());
    const res = await fetch(`/friendly?type=summary&url=${url}`);
    const json = await res.json();
    scoreEl.textContent = json.score ?? 'N/A';

    supEl.innerHTML = '';
    (json.ai_superpowers || []).forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${s.title}</strong>: ${s.explanation}`;
      supEl.append(li);
    });

    oppEl.innerHTML = '';
    (json.ai_opportunities || []).forEach(o => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${o.title}</strong>: ${o.explanation}`;
      oppEl.append(li);
    });

    rawEl.textContent = JSON.stringify(json, null, 2);
  });
});