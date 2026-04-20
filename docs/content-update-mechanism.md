# Content Update Mechanism

This document describes how news articles are fetched, cached, and updated in thelinuxformula.com.

## Architecture Overview

```
┌─────────────┐      fetch news-feed.json      ┌─────────────┐
│  Main.js   │ ────────────────────────  │ NewsWorker │
│ (browser)  │ ◄ ─────────────────────── │ (worker)  │
└─────────────┘   postMessage({type:'news'}) └─────────────┘
       │
       ▼
┌─────────────┐
│ localStorage│  (LZ-string compressed)
└─────────────┘
```

## Fetch Flow (NewsWorker)

The `newsWorker.js` runs in a Web Worker to fetch news independently of the main UI thread.

### 1. Initial Fetch

```javascript
// newsWorker.js
fetchNews();  // Called immediately on worker start
```

### 2. Periodic Polling

| Parameter | Value | Description |
|-----------|-------|------------|
| `POLL_INTERVAL` | 3600000ms | 1 hour between checks |
| `FETCH_URL` | `/news/news-feed.json` | News data endpoint |

### 3. Hash-Based Change Detection

```javascript
// Compute SHA-256 hash of news-feed.json
const hash = await computeHash(data);

// If hash unchanged, skip rendering
if (hash === lastHash && lastVersion !== null) {
  self.postMessage({ type: 'unchanged' });
  return;  // No update needed
}
```

Using content hash (not timestamp) ensures updates only when content actually changes.

### 4. Message Types

| Type | Payload | Action |
|------|---------|--------|
| `news` | `{data, hash}` | Render articles |
| `error` | `{message}` | Show error |
| `unchanged` | — | Skip (cache valid) |

## Cache Flow (Main.js)

### 1. Offline-First Strategy

```javascript
// Try localStorage first, then fetch in background
function initializeOfflineFirst() {
  var storedArticles = retrieveAndDecompress(currentLang);
  
  if (storedArticles) {
    renderArticles(storedArticles);      // Show immediately
    worker.postMessage({type:'refresh'}); // Background fetch
  }
}
```

### 2. Compression

Articles are compressed with LZ-string before storage:

```javascript
function compressAndStore(lang, articles) {
  var compressed = LZString.compressToBase64(JSON.stringify(articles));
  localStorage.setItem('tlf_articles_' + lang, compressed);
}
```

### 3. Storage Keys

| Key | Content |
|----|---------|
| `tlf_articles_it` | Italian articles (compressed) |
| `tlf_articles_en` | English articles (compressed) |
| `tlf_hash` | SHA-256 of last fetched content |
| `tlf_version` | Schema version |
| `tlf_app_version` | App version for auto-update |

### 4. On News Receipt

```javascript
worker.onmessage = function(e) {
  if (e.data.type === 'news') {
    compressAndStore(currentLang, e.data.data);  // Cache
    storeHash(e.data.hash);                    // Store hash
    renderArticles(filteredArticles);          // Render
  }
};
```

## Error Handling

### Network Errors

- Exponential backoff on consecutive failures:
  - 3 errors → retry after 30s
  - 6 errors → retry after 60s
  - Normal operation → 1 hour interval

### Worker Errors

- `worker.onerror` catches runtime errors
- `window.onerror` global handler catches other JS errors

## Benefits

1. **Non-blocking**: Worker runs independently of UI
2. **Efficient**: Hash-based change detection skips unnecessary renders
3. **Offline-capable**: localStorage provides instant load
4. **Simple**: No version.txt logic (PWA handles shell updates)
5. **Compression**: LZ-string reduces localStorage usage