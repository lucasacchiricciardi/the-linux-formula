const FETCH_URL = '/news/news-feed.json';
const VERSION_URL = '/version.txt';
const POLL_INTERVAL = 3600000;

let lastHash = null;
let lastVersion = null;
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
    const [newsResponse, versionResponse] = await Promise.all([
      fetch(FETCH_URL),
      fetch(VERSION_URL).catch(() => null)
    ]);

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

    if (hash === lastHash && lastVersion !== null) {
      self.postMessage({ type: 'unchanged' });
      scheduleNextPoll(POLL_INTERVAL);
      return;
    }

    if (versionResponse && versionResponse.ok) {
      const remoteVersion = (await versionResponse.text()).trim();
      if (lastVersion !== null && remoteVersion !== lastVersion) {
        self.postMessage({ type: 'version-mismatch', oldVersion: lastVersion, newVersion: remoteVersion });
      }
      lastVersion = remoteVersion;
    }

    lastVersion = lastVersion || '2.0.0';
    lastHash = hash;
    const parsed = JSON.parse(data);
    self.postMessage({ type: 'news', data: parsed.articles || [], version: lastVersion, hash: hash });
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