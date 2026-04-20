// Base URL for fetching news, set by main thread via 'setBaseUrl' message
let BASE_URL = '';
let FETCH_URL = '';

let lastHash = null;
let consecutiveErrors = 0;
let pollTimeout;

// Default fallback for backward compatibility (should be overridden by main thread)
if (!BASE_URL) {
  BASE_URL = '/the-linux-formula';
  FETCH_URL = BASE_URL + '/news/news-feed.json';
}

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
    const newsResponse = await fetch(FETCH_URL);

    if (!newsResponse.ok) {
      self.postMessage({ type: 'error', message: `HTTP ${newsResponse.status}: ${newsResponse.statusText}` });
      consecutiveErrors++;
      let nextInterval = POLL_INTERVAL;
      if (consecutiveErrors >= 3) nextInterval = 30000;
      if (consecutiveErrors >= 6) nextInterval = 60000;
      scheduleNextPoll(nextInterval);
      return;
    }

    const data = await newsResponse.text();
    const hash = await computeHash(data);

    // Skip if content unchanged
    if (hash === lastHash) {
      self.postMessage({ type: 'unchanged' });
      scheduleNextPoll(POLL_INTERVAL);
      return;
    }

    lastHash = hash;
    const parsed = JSON.parse(data);
    self.postMessage({ type: 'news', data: parsed.articles || [], hash: hash });
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
  if (e.data && e.data.type === 'setBaseUrl') {
    BASE_URL = e.data.baseUrl;
    FETCH_URL = BASE_URL + '/news/news-feed.json';
  }
};

fetchNews();