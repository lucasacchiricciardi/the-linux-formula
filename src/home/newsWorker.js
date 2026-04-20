const FETCH_URL = '/news/news-feed.json';
const POLL_INTERVAL = 300000;

let lastHash = null;
let consecutiveErrors = 0;
let pollTimeout;

function scheduleNextPoll(interval) {
  pollTimeout = setTimeout(fetchNews, interval);
}

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
      consecutiveErrors++;
      let nextInterval = POLL_INTERVAL;
      if (consecutiveErrors >= 3) nextInterval = 30000;
      if (consecutiveErrors >= 6) nextInterval = 60000;
      scheduleNextPoll(nextInterval);
      return;
    }
    const data = await response.text();
    const hash = await computeHash(data);

    if (hash === lastHash) {
      self.postMessage({ type: 'unchanged' });
      scheduleNextPoll(POLL_INTERVAL);
      return;
    }

    lastHash = hash;
    const parsed = JSON.parse(data);
    self.postMessage({ type: 'news', data: parsed.articles || [] });
    consecutiveErrors = 0;
    scheduleNextPoll(POLL_INTERVAL);
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Network error' });
    consecutiveErrors++;
    let nextInterval = POLL_INTERVAL;
    if (consecutiveErrors >= 3) nextInterval = 30000;
    if (consecutiveErrors >= 6) nextInterval = 60000;
    scheduleNextPoll(nextInterval);
  }
}

self.onmessage = function(e) {
  if (e.data && e.data.type === 'refresh') {
    fetchNews();
  }
};

fetchNews();