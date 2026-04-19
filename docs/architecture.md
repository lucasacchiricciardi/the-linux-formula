# Architecture Decisions

## 2026-04-19 — Initial architecture

**Context:** Static site for thelinuxformula.com with async news module.

**Decisions:**

### ADR-001: Vanilla JS stack (no framework)
- No React/Vue/Svelte. DOM manipulation via native APIs only.
- Rationale: zero runtime dependencies, maximum portability for GitHub Pages.
- Constraint: all DOM injection via `document.createElement` + `textContent` (XSS prevention).

### ADR-002: Web Worker for news fetching
- News data fetched asynchronously in a dedicated Worker (`newsWorker.js`).
- Worker communicates with main thread via `postMessage` / `onmessage`.
- Polling: fetch on load + every 5 minutes (`setInterval(300000)`).
- Caching: SHA-256 content hash stored in memory. If hash unchanged → `{ type: 'unchanged' }`.
- Message protocol: `{ type: 'news' | 'error' | 'unchanged', data?: [...], message?: string }`.
- Rationale: prevent main thread blocking during network I/O; hash-based caching avoids redundant DOM updates.
- Constraint: Worker has no access to `window` or `document`. Must handle network failures gracefully.

### ADR-003: Local build script for MD → JSON
- `scripts/build-news.js` runs locally before deploy, converts `src/raw/*.md` → `dist/news/news-feed.json`.
- Uses only Node native modules (`fs`, `path`). Frontmatter parsed with inline regex (zero dependencies).
- Output schema: `{ articles: [{ id: string, title: string, date: string|null, tags: string[], content: string }] }`.
- `id` derived from filename without extension. Missing frontmatter → filename as title, `null` date, empty tags.
- Articles sorted by `date` descending (most recent first).
- Rationale: no server-side runtime needed; GitHub Pages serves static JSON.
- Constraint: script must be idempotent.

### ADR-006: News feed UI placement and design
- `<section id="news-feed-container">` placed after hero section, before bio bento grid in `index.html`.
- Cards follow existing design system: `bg-surface-container-low`, `border-t-4 border-primary`, `font-headline` titles, `font-body` content, `font-label` metadata.
- Rationale: integrates news into the page's visual hierarchy without disrupting existing layout.
- Constraint: only `document.createElement` + `textContent` for DOM injection (XSS prevention).

### ADR-004: Material Design 3 via Tailwind CDN
- Color tokens, typography scale, and elevation layers follow MD3 semantics.
- Tailwind loaded via CDN, config inline in `index.html`.
- Rationale: single HTML file, no build step for CSS.

### ADR-005: Visual identity — no rounded corners
- Buttons, CTAs, cards use `rounded-none` and minimal `borderRadius` (0.25rem default).
- Rationale: deliberate brutalist aesthetic matching the "sysadmin terminal" theme.