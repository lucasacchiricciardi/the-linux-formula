# PWA Update Mechanism

This document describes how the Progressive Web App (PWA) caches assets and updates content.

## Service Worker Architecture

```
┌─────────────┐       fetch       ┌─────────────┐
│  Browser   │ ────────────────  │ Service   │
│           │ ◄ ────────────── │ Worker   │
│ (cache)   │                 │ (sw.js)  │
└─────────────┘                 └─────────────┘
        │                            │
        ▼                            ▼
┌─────────────┐              ┌─────────────┐
│ Network   │              │  Cache    │
│           │              │ Storage  │
└─────────────┘              └─────────────┘
```

## Cache Strategy

The Service Worker uses a **Network-First with Cache Fallback** strategy:

```javascript
// sw.js - Fetch event handler
self.addEventListener('fetch', function(event) {
  // Try network first
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Clone and cache successful response
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, response.clone());
        });
        return response;
      })
      .catch(function() {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});
```

## Cached Assets

| Path | Description |
|------|-------------|
| `/` | Root (fallback) |
| `/index.html` | Main HTML |
| `/main.js` | Main JavaScript |
| `/newsWorker.js` | Web Worker |
| `/favicon.svg` | Favicon |
| `/news/news-feed.json` | News data |
| `/version.txt` | Version file |
| `/robots.txt` | Robots file |
| `/sitemap.xml` | Sitemap |

## Update Flow

### 1. Install Event

```javascript
self.addEventListener('install', function(event) {
  // Pre-cache all assets
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Skip waiting, activate immediately
  self.skipWaiting();
});
```

### 2. Activate Event

```javascript
self.addEventListener('activate', function(event) {
  // Clean old caches
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim existing clients
  self.clients.claim();
});
```

### 3. Cache Version

```javascript
const CACHE_NAME = 'tlf-v1';
```

When updating the site, increment `CACHE_NAME` to force cache refresh.

## Offline Behavior

When the user is offline:

1. Request goes to Service Worker
2. Network fetch fails
3. Falls back to cached responses
4. If no cache, returns root fallback (`/`)

```
Online:  request → network → cache response → done
Offline: request → fail → cache → fallback → done
```

## Browser Registration

```javascript
// main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function() {
    // Silent fail - app works without PWA
  });
}
```

## PWA Installation

Users can install the PWA from their browser:

- **Chrome**: "Install" icon in address bar
- **Mobile**: "Add to Home Screen" prompt
- **Desktop**: Context menu → "Install"

### Web App Manifest

```json
// manifest.json
{
  "name": "The Linux Formula",
  "short_name": "TLF",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8f9fa",
  "theme_color": "#003f87",
  "icons": [...]
}
```

### Theme Color

```html
<meta name="theme-color" content="#003f87"/>
```

## Benefits

| Feature | Description |
|---------|-------------|
| Offline access | Cached pages load without network |
| Fast load | Network-first with cache fallback |
| Installable | Add to home screen |
| App-like | Standalone mode, no browser chrome |
| Auto-update | Fresh content on reconnect |

## Limitations

- Service Worker only caches listed assets
- News content comes from NewsWorker + localStorage
- PWA doesn't replace the news caching mechanism
- Separate systems: SW for shell, NewsWorker for content