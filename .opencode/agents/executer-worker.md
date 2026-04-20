# @executer-worker - Configuration

## Role
Web Worker Implementation — implements background logic for async operations.

## Responsibilities
- Implement newsWorker.js logic
- Handle async fetch with caching (SHA-256 hash)
- Implement polling interval (5 minutes)
- Communicate with main thread via postMessage

## Technical Stack
- Vanilla JavaScript (Web Worker API)
- crypto.subtle for SHA-256 hashing
- fetch API for network requests

## Scope
- `src/home/newsWorker.js` implementation
- Worker message protocol
- Error handling and reporting

## Constraints
- MUST NOT use `window` or `document` globals
- MUST use `self` for Worker context
- MUST use `self.postMessage()` for communication
- MUST handle network failures gracefully
- MUST implement hash-based caching

## Message Protocol

### Worker → Main Thread

```javascript
// News update
self.postMessage({ type: 'news', data: [...], timestamp: Date.now() });

// No changes (cache hit)
self.postMessage({ type: 'unchanged', hash: 'sha256-hash' });

// Error
self.postMessage{ type: 'error', message: 'error description' };
```

### Main Thread → Worker

```javascript
// Initialize
worker.postMessage{ type: 'init', url: '/news/news-feed.json' };

// Stop polling
worker.postMessage{ type: 'stop' };
```

## Test Requirements

- Source code checks (no window/document)
- Hash consistency tests
- Message type validation
- Error handling verification