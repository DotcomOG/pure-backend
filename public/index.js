document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('url-form');
  const input = document.getElementById('url-input');
  const scoreEl = document.getElementById('score');
  const superEl = document.getElementById('superpowers');
  const oppEl = document.getElementById('opportunities');
  const rawEl = document.getElementById('raw-json');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const url = encodeURIComponent(input.value);
    scoreEl.textContent = 'Loading…';
    superEl.innerHTML = '';
    oppEl.innerHTML = '';
    rawEl.textContent = '';

    try {
      const res = await fetch(`/friendly?type=summary&url=${url}`);
      const data = await res.json();

      if (data.error) throw new Error(data.detail);

      scoreEl.textContent = data.score ?? 'N/A';

      (data.ai_superpowers || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.title}: ${item.explanation}`;
        superEl.appendChild(li);
      });

      (data.ai_opportunities || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.title}: ${item.explanation}`;
        oppEl.appendChild(li);
      });

      rawEl.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      scoreEl.textContent = 'Error';
      rawEl.textContent = err.message;
    }
  });
});