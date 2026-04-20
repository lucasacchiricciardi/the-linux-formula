const FETCH_URL = '/news/news-feed.json';
const POLL_INTERVAL = 300000;

let lastHash = null;

async function computeHash(data) {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchNews() {
  try {
    const response = await fetch(FETCH_URL);
    if (!response.ok) {
      self.postMessage({ type: 'error', message: `HTTP ${response.status}: ${response.statusText}` });
      return;
    }
    const data = await response.text();
    const hash = await computeHash(data);

    if (hash === lastHash) {
      self.postMessage({ type: 'unchanged' });
      return;
    }

    lastHash = hash;
    const parsed = JSON.parse(data);
    self.postMessage({ type: 'news', data: parsed.articles || [] });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Network error' });
  }
}

self.onmessage = function(e) {
  if (e.data && e.data.type === 'refresh') {
    fetchNews();
  }
};

fetchNews();
setInterval(fetchNews, POLL_INTERVAL);