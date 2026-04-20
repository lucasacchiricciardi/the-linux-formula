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

### ADR-007: Test strategy — source code string checks
- Tests use string-matching on source files (`readFileSync` + `includes`) rather than runtime execution or DOM simulation.
- Rationale: zero external dependencies (no jsdom, no test framework beyond `node:test`); fast execution; verifies contract patterns (no `innerHTML`, no `window` in Worker).
- Gap: does not catch runtime errors (e.g., the `export` bug in newsWorker.js was not detected because the Worker was never instantiated in tests).
- Mitigation: the `computeHash` function is tested separately via direct invocation with `crypto.subtle` in the test file. Future consideration: add browser-based E2E tests or Playwright for runtime verification.

### ADR-008: Deploy pipeline — GitHub Actions official Pages actions
- Two-job pipeline: `build` (checkout, test, build, upload artifact) → `deploy` (`actions/deploy-pages@v4`).
- Trigger: push to `main` branch + manual `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- Concurrency: `group: pages`, `cancel-in-progress: false`.
- GitHub Pages Source must be set to "GitHub Actions" (not "Deploy from a branch").
- Rationale: official actions are maintained by GitHub, support Node.js 24, and eliminate dependency on third-party actions. The `peaceiris/actions-gh-pages` approach required a `publish` branch and the legacy "Deploy from a branch" Pages setting.

### ADR-009: Inline markdown-to-HTML converter (block-level parser)
- `markdownToHtml()` in `scripts/build-news.js` is a hand-written parser, not a library.
- Phase 1 (Sprint 1) used regex-based replacements that produced invalid HTML (`<p><h2>`, `<br>` inside `<ul>`).
- Phase 2 (Sprint 2) rewrote it as a block-level parser: splits input into blocks (headers, lists, paragraphs) and wraps each appropriately.
- Supported syntax: `#`/`##`/`###` headers, `**bold**`, `*italic*`, `` `code` ``, `[link](url)`, `- list items`, plain paragraphs.
- Not supported: code fences, blockquotes, images, tables, nested lists.
- Rationale: zero npm dependencies; the source articles are controlled content (developer-authored). A full markdown library (e.g., `marked`) could be added later if content complexity increases, but the build script must remain zero-dependency.