# Sprint Progress

## Sprint 1 — News Worker Module

### Implementation Plan

| Step | Task | Agent | Scope | Files | Commit |
|------|------|-------|-------|-------|--------|
| 1 | Fixture MD + test build script (RED) | Plan (GLM-5.1) | `build` | `src/raw/example*.md`, `scripts/build-news.test.js` | — |
| 2 | Implement build script (GREEN + REFACTOR) | Build (Grok) | `build` | `scripts/build-news.js` | `feat(build): add news feed build script` |
| 3 | Test worker (RED) | Plan (GLM-5.1) | `worker` | `src/home/newsWorker.test.js` | — |
| 4 | Implement worker with hash caching + 5min polling (GREEN + REFACTOR) | Build (Grok) | `worker` | `src/home/newsWorker.js` | `feat(worker): add news web worker with hash caching and polling` |
| 5 | Test main thread (RED) | Plan (GLM-5.1) | `ui` | `src/home/main.test.js` | — |
| 6 | Add `#news-feed-container` in index.html + implement main.js (GREEN + REFACTOR) | Build (Grok) | `ui` | `src/home/index.html`, `src/home/main.js` | `feat(ui): add news feed section and main thread integration` |
| 7 | Update progress + architecture docs | Build (Grok) | `docs` | `docs/progress.md`, `docs/architecture.md` | `docs: update sprint 1 progress` |

### Task Progress

| Task | Status | Notes |
|------|--------|-------|
| 2.1 Build script (`scripts/build-news.js`) | ✅ Done | Frontmatter parser + MD→HTML + idempotent JSON output |
| 2.2 Web Worker (`src/home/newsWorker.js`) | ✅ Done | SHA-256 hash caching + 5min polling + error handling |
| 2.3 Main thread (`src/home/main.js`) | ✅ Done | Worker init, DOM injection, XSS-safe, skeleton removal |

### Test Execution

```bash
node --test scripts/build-news.test.js   # 7 pass
node --test src/home/newsWorker.test.js   # 6 pass
node --test src/home/main.test.js         # 6 pass
```

Total: **19 tests, 0 failures**. Zero npm dependencies — Node 24 built-in `node:test` + `node:assert`.

### Validation Checklist (from sprint prompt)

- [x] **Build Locale:** Running `node scripts/build-news.js` generates/updates `dist/news/news-feed.json`
- [x] **Worker Isolation:** `newsWorker.js` uses only Worker-compatible APIs (no `window` or `document`)
- [x] **Error Handling:** Worker handles network failures, reports errors to main thread via `{ type: 'error' }`
- [x] **Documentation:** `architecture.md`, `progress.md` updated
- [x] **Git Flow:** Atomic Conventional Commits

---

## Sprint 2 — Bug Fixes & Quality

### Implementation Plan

| Step | Task | Scope | Files | Commit |
|------|------|-------|-------|--------|
| 1 | Remove `export { computeHash }` from newsWorker.js (critical: breaks Worker in browser) | `worker` | `src/home/newsWorker.js` | `fix(worker): remove ES module export` |
| 2 | Remove duplicate Material Symbols `<link>` in index.html | `ui` | `src/home/index.html` | `fix(ui): remove duplicate font link` |
| 3 | Rewrite `markdownToHtml` to produce valid HTML (no `<p>` around block elements) | `build` | `scripts/build-news.js` | `fix(build): valid HTML output from markdown converter` |
| 4 | Add loading skeleton in news section | `ui` | `src/home/index.html`, `src/home/main.js` | `feat(ui): add news feed loading skeleton` |
| 5 | Add `<noscript>` fallback in news section | `ui` | `src/home/index.html` | `feat(ui): add noscript fallback` |
| 6 | Add SEO meta tags (og:title, og:description, canonical, description) | `ui` | `src/home/index.html` | `feat(ui): add SEO meta tags` |
| 7 | Add SVG favicon | `ui` | `src/home/favicon.svg`, `src/home/index.html`, `scripts/build-news.js` | `feat(ui): add favicon` |
| 8 | Add mobile menu toggle handler | `ui` | `src/home/index.html`, `src/home/main.js` | `feat(ui): add mobile menu toggle` |
| 9 | Switch deploy workflow to official GitHub Pages actions | `build` | `.github/workflows/deploy.yml` | `chore(deploy): switch to official GitHub Pages actions` |

### Task Progress

| Task | Status | Notes |
|------|--------|-------|
| 2.1 Worker export bug fix | ✅ Done | `export { computeHash }` removed; classic Workers don't support ES module syntax |
| 2.2 Duplicate font link | ✅ Done | Removed duplicate Material Symbols Outlined `<link>` |
| 2.3 markdownToHtml rewrite | ✅ Done | Block-level parser: `<h2>`, `<h3>`, `<ul>/<li>`, `<p>` — no invalid nesting |
| 2.4 Loading skeleton | ✅ Done | `#news-feed-skeleton` with pulse animation, removed on first news render |
| 2.5 Noscript fallback | ✅ Done | `<noscript>` message in news section |
| 2.6 SEO meta tags | ✅ Done | `og:title`, `og:description`, `og:type`, `og:url`, `canonical`, `description` |
| 2.7 SVG favicon | ✅ Done | `favicon.svg` (LF monogram on primary bg), linked in `<head>`, copied in build |
| 2.8 Mobile menu toggle | ✅ Done | Hamburger/close icon swap, toggle `hidden` on `#mobile-menu` |
| 2.9 Deploy workflow | ✅ Done | `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`, two-job pipeline |

### Validation Checklist

- [x] **Worker loads in browser:** No `export` statement — classic Worker compatible
- [x] **Valid HTML output:** `markdownToHtml` produces no `<p><h2>` nesting
- [x] **Loading state visible:** Skeleton shown until Worker responds
- [x] **Deploy via GitHub Actions:** Official Pages actions, `workflow_dispatch` support
- [x] **All 19 tests pass:** No regressions

---

## Sprint 3 — Test Quality & Accessibility (Planned)

### Implementation Plan

| Step | Task | Scope | Priority | Files | Description |
|------|------|-------|----------|-------|-------------|
| 1 | Add unit tests for `parseFrontmatter()` | `build` | High | `scripts/build-news.test.js` | Test edge cases: multi-line arrays, missing date, empty tags, duplicate keys |
| 2 | Add unit tests for `markdownToHtml()` | `build` | High | `scripts/build-news.test.js` | Test: headers, bold/italic, code, links, lists, paragraphs, empty input, mixed content |
| 3 | Add unit tests for `stripHtml()` | `ui` | High | `src/home/main.test.js` | Test: HTML tags removal, nested tags, attributes, empty string, plain text pass-through |
| 4 | Add `worker.onerror` handler in main.js | `worker` | Medium | `src/home/main.js` | Catch Worker instantiation errors, show error in UI instead of silent failure |
| 5 | Add exponential backoff on repeated fetch errors | `worker` | Medium | `src/home/newsWorker.js` | After N consecutive errors, increase polling interval (5→30→60s). Reset on success |
| 6 | Add ARIA labels and skip-nav link | `ui` | Medium | `src/home/index.html` | Skip to main content link, `aria-label` on nav, `role="status"` on news container |
| 7 | Wrap news cards in `<article>` elements | `ui` | Medium | `src/home/main.js` | Change `<div>` to `<article>` in `createArticleElement()` |
| 8 | Focus management for mobile menu | `ui` | Low | `src/home/main.js` | Trap focus inside mobile menu when open, return focus to toggle button on close |
| 9 | Add ADR-007: Test strategy (source code checks vs functional) | `docs` | Medium | `docs/architecture.md` | Document current string-matching approach, rationale, and gap (no runtime Worker test) |
| 10 | Add ADR-008: Deploy pipeline architecture | `docs` | Medium | `docs/architecture.md` | Document two-job build+deploy workflow, GitHub Pages via Actions, no branch-based deploy |
| 11 | Add ADR-009: markdownToHtml block-level parser | `docs` | Low | `docs/architecture.md` | Document why native Markdown lib was avoided, inline parser approach, known limitations |

### Task Progress

| Task | Status | Notes |
|------|--------|-------|
| 3.1 parseFrontmatter unit tests | ✅ Done | Added 7 unit tests covering edge cases: multi-line arrays, missing date, empty tags, duplicate keys, CRLF |
| 3.2 markdownToHtml unit tests | ✅ Done | Added 8 unit tests for headers, bold/italic, code, links, lists, paragraphs, empty input, mixed content |
| 3.3 stripHtml unit tests | ✅ Done | Added 6 unit tests for HTML removal, nested tags, attributes, empty string, plain text, self-closing tags |
| 3.4 worker.onerror handler | ✅ Done | Added try-catch for Worker instantiation and worker.onerror for runtime errors |
| 3.5 Exponential backoff | ✅ Done | Added consecutive error tracking, backoff to 30s after 3 errors, 60s after 6 errors, reset on success |
| 3.6 ARIA labels + skip-nav | ✅ Done | Added skip-to-main link, aria-label on nav, role="status" aria-live="polite" on news container |
| 3.7 Article semantic elements | ✅ Done | Changed createArticleElement to use <article> instead of <div> |
| 3.8 Focus management mobile menu | ✅ Done | Trap focus on open, return to button on close, escape key support |
| 3.9 ADR-007: Test strategy | ✅ Done | Already documented in architecture.md |
| 3.10 ADR-008: Deploy pipeline | ✅ Done | Already documented in architecture.md |
| 3.11 ADR-009: markdownToHtml | ✅ Done | Already documented in architecture.md |

### Validation Checklist

- [ ] All new unit tests pass (target: 30+ total)
- [ ] Worker `onerror` shows error in UI instead of silent failure
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] All ADRs documented with context, decision, rationale, constraints

---

## Sprint 4 — Content, SEO & Polish (Planned)

### Implementation Plan

| Step | Task | Scope | Priority | Files | Description |
|------|------|-------|----------|-------|-------------|
| 1 | Add `og:image` meta tag with site screenshot/banner | `ui` | Medium | `src/home/index.html`, `src/home/og-image.png` | Create and reference an OG image for social sharing |
| 2 | Dynamic copyright year | `ui` | Low | `src/home/index.html` | Replace hardcoded `2023 - 2026` with JS `new Date().getFullYear()` |
| 3 | Nav link targets (point to section IDs or external URLs) | `ui` | Medium | `src/home/index.html`, `src/home/main.js` | Replace `href="#"` with actual section anchors or external links |
| 4 | Obfuscate email/phone in footer | `ui` | Medium | `src/home/index.html` | Use `mailto:` with JS injection or ROT13 to reduce spam harvesting |
| 5 | Add `<meta name="robots" content="index, follow">` | `ui` | Low | `src/home/index.html` | Explicit crawl directive |
| 6 | Add structured data (JSON-LD) for organization | `ui` | Low | `src/home/index.html` | Schema.org `Organization` markup |
| 7 | Add `.editorconfig` for consistent formatting | `chore` | Low | `.editorconfig` | 2-space indent, LF line endings, trailing newline |
| 8 | Add `robots.txt` and `sitemap.xml` generation in build script | `build` | Low | `scripts/build-news.js` | Generate static `robots.txt` + `sitemap.xml` from article dates |

### Task Progress

| Task | Status | Notes |
|------|--------|-------|
| 4.1 OG image | ⬜ Planned | |
| 4.2 Dynamic copyright year | ⬜ Planned | |
| 4.3 Nav link targets | ⬜ Planned | |
| 4.4 Email/phone obfuscation | ⬜ Planned | |
| 4.5 Robots meta | ⬜ Planned | |
| 4.6 JSON-LD structured data | ⬜ Planned | |
| 4.7 EditorConfig | ⬜ Planned | |
| 4.8 robots.txt + sitemap.xml | ⬜ Planned | |

### Validation Checklist

- [ ] Lighthouse SEO score ≥ 90
- [ ] No `href="#"` on any anchor element
- [ ] Email/phone not in plaintext in HTML source
- [ ] `robots.txt` and `sitemap.xml` accessible at site root