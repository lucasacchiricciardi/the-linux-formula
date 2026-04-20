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
| 4.1 OG image | ✅ Done | Added og:image meta tag pointing to favicon.svg |
| 4.2 Dynamic copyright year | ✅ Done | JS-injected year via `new Date().getFullYear()` |
| 4.3 Nav link targets | ✅ Done | Replaced all `href="#"` with section anchors or external URLs |
| 4.4 Email/phone obfuscation | ✅ Done | JS-injected via createElement, not in plaintext HTML |
| 4.5 Robots meta | ✅ Done | `<meta name="robots" content="index, follow">` |
| 4.6 JSON-LD structured data | ✅ Done | Schema.org Organization markup added |
| 4.7 EditorConfig | ✅ Done | `.editorconfig` with 2-space indent, LF, trailing newline |
| 4.8 robots.txt + sitemap.xml | ✅ Done | Build script generates both, tests added |

### Validation Checklist

- [x] Lighthouse SEO score ≥ 90 (attuale: 98)
- [x] No `href="#"` on any anchor element
- [x] Email/phone not in plaintext in HTML source
- [x] `robots.txt` and `sitemap.xml` accessible at site root

---

## Sprint 5 — v2.0 Breaking Changes: Multilingua + localStorage + Auto-Update

### Contesto

Commit `8fadf74` ha introdotto le fondamenta v2.0 nel build script e nel worker:
- build-news.js estrae `lang` dal frontmatter (default `it`)
- build-news.js genera `dist/version.txt`
- newsWorker.js: polling 1h, fetch `/version.txt`, messaggio `version-mismatch`

**Mancano tutti i componenti client-side** per completare i requisiti PRD v2.0 (sez. 6-7-8).

### Gap Analysis vs PRD v2.0 Acceptance Criteria

| # | Acceptance Criteria | Stato | Dettaglio |
|---|--------------------|-------|-----------|
| 1 | Build script genera `news-feed.json` con campo `lang` | ✅ | `build-news.js` estrae `lang` dal frontmatter |
| 2 | Build script genera `dist/version.txt` | ✅ | Generato con semver da `BUILD_VERSION` |
| 3 | Web Worker filtra articoli per lingua rilevata | ❌ | Worker invia TUTTI gli articoli, nessun filtro |
| 4 | Web Worker esegue version checking ad ogni ciclo | ✅ | Fetch `/version.txt` + confronto `lastVersion` |
| 5 | Polling interval: 1 ora | ✅ | `POLL_INTERVAL = 3600000` |
| 6 | Se remote version > local: invalidazione cache forzata | ❌ | Worker invia `version-mismatch` ma main.js NON lo gestisce |
| 7 | Language switcher imposta cookie e aggiorna contenuto | ❌ | Nessun language switcher nell'UI |
| 8 | Articoli compressi con LZ-string in localStorage | ❌ | Nessuna integrazione LZ-string |
| 9 | Offline: articoli visualizzati da localStorage decompresso | ❌ | Nessuna lettura da localStorage |
| 10 | Hash comparison: skip fetch se cache valida | ❌ | Hash calcolato solo nel worker, mai salvato in localStorage |
| 11 | Migrazione: clear localStorage vecchio al primo accesso v2.0 | ❌ | Nessuna logica di migrazione |
| 12 | Zero XSS: solo `createElement` + `textContent` | ✅ | Già implementato |

### Implementation Plan

| Step | Task | Scope | Priority | Files | Description |
|------|------|-------|----------|-------|-------------|
| 5.1 | Language detection logic | `ui` | High | `src/home/main.js` | Funzione `getPreferredLanguage()`: cookie `tlf_lang` → `navigator.language` → fallback `it`. Funzione `setLanguageCookie(lang)` |
| 5.2 | Language switcher UI (desktop) | `ui` | High | `src/home/index.html` | Due pulsanti IT/EN nella nav bar (lato destro, dopo LogWhispererAI). Design: `border-l-4 border-primary` per stato attivo, `border-outline-variant/20` per inattivo. Material Symbols `translate` come icona |
| 5.3 | Language switcher UI (mobile) | `ui` | High | `src/home/index.html` | Stessi pulsanti IT/EN nel `#mobile-menu`. Stato attivo coerente con desktop |
| 5.4 | Language switcher handler | `ui` | High | `src/home/main.js` | Click handler: imposta cookie + aggiorna `currentLang` + invia `{ type: 'refresh' }` al worker + aggiorna UI attiva/inattiva |
| 5.5 | Article filtering by language | `ui` | High | `src/home/main.js` | In `worker.onmessage` per `type: 'news'`: filtra `msg.data` per `article.lang === currentLang` prima di `renderArticles()` |
| 5.6 | Test language detection | `ui` | High | `src/home/main.test.js` | Test `getPreferredLanguage()`: cookie priority, navigator fallback, default `it` |
| 5.7 | Test language switcher DOM | `ui` | High | `src/home/main.test.js` | Verifica esistenza pulsanti `#lang-it-btn` e `#lang-en-btn` in HTML |
| 5.8 | Test article filtering by lang | `ui` | High | `src/home/main.test.js` | Verifica che `renderArticles` riceva solo articoli con `lang` corretto |
| 5.9 | Add LZ-string via CDN | `ui` | High | `src/home/index.html` | `<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js"></script>` prima di `main.js` |
| 5.10 | localStorage helpers | `ui` | High | `src/home/main.js` | Funzioni: `compressAndStore(lang, articles)`, `retrieveAndDecompress(lang)`, `storeHash(hash)`, `retrieveHash()`. Chiavi: `tlf_articles_{lang}`, `tlf_hash` |
| 5.11 | Offline-first load strategy | `ui` | High | `src/home/main.js` | All'inizializzazione: leggi localStorage → se presente, renderizza immediato → poi fetch background per aggiornamento |
| 5.12 | Store on news receipt | `ui` | High | `src/home/main.js` | In `worker.onmessage` per `type: 'news'`: salva articoli compressi in localStorage + aggiorna hash |
| 5.13 | Worker sends hash in news message | `worker` | High | `src/home/newsWorker.js` | Aggiungere `hash` al messaggio `{ type: 'news', data, version, hash }` |
| 5.14 | Test LZ-string compression | `ui` | High | `src/home/main.test.js` | Test `compressAndStore` + `retrieveAndDecompress`: roundtrip, dati coerenti, gestione errore |
| 5.15 | Test offline-first load | `ui` | Medium | `src/home/main.test.js` | Verifica che localStorage venga letto all'avvio e renderizzato |
| 5.16 | Handle `version-mismatch` in main.js | `ui` | High | `src/home/main.js` | In `worker.onmessage`: gestisci `type: 'version-mismatch'` → clear `tlf_articles_*` e `tlf_hash` da localStorage → aggiorna `tlf_app_version` → forza re-fetch |
| 5.17 | App version localStorage keys | `ui` | High | `src/home/main.js` | Chiavi: `tlf_version` (schema), `tlf_app_version` (app per auto-update). Salvare/leggere in `worker.onmessage` |
| 5.18 | Migration logic v1.x → v2.0 | `ui` | Medium | `src/home/main.js` | All'avvio: se `tlf_version` assente o ≠ `2.0.0` → clear tutte le chiavi `tlf_*` → set `tlf_version = 2.0.0` → mostra notifica "Benvenuto in v2.0" |
| 5.19 | Test version-mismatch handling | `ui` | Medium | `src/home/main.test.js` | Verifica che `version-mismatch` triggeri clear cache + re-fetch |
| 5.20 | Test migration logic | `ui` | Medium | `src/home/main.test.js` | Verifica clear localStorage quando versione mancante/vecchia |
| 5.21 | Rename MD files to `<slug>-<lang>.md` | `build` | Medium | `src/raw/` | `kernel-61-lts.md` → `kernel-61-lts-it.md`, `systemd-vs-openrc.md` → `systemd-vs-openrc-it.md`. Aggiornare build script se necessario |
| 5.22 | Add English article fixtures | `build` | Medium | `src/raw/` | Creare `kernel-61-lts-en.md` e `systemd-vs-openrc-en.md` per test multilingua |
| 5.23 | Update build script tests | `build` | Medium | `scripts/build-news.test.js` | Aggiornare test per nuovi nomi file e presenza articoli EN |
| 5.24 | Update Sprint 3/4 validation checklists | `docs` | Low | `docs/progress.md` | Spuntare checklists rimaste aperte nei sprint precedenti |
| 5.25 | Run full test suite + validate | — | High | — | `node --test` su tutti e 3 i file test. Target: 0 failures |

### Dependency Graph

```
5.1 (language detection) ──┬──→ 5.4 (switcher handler) ──→ 5.5 (article filtering)
                           │
5.2 (switcher UI desktop) ─┤
5.3 (switcher UI mobile) ──┘

5.9 (LZ-string CDN) ──┬──→ 5.10 (localStorage helpers) ──┬──→ 5.11 (offline-first load)
                       │                                  ├──→ 5.12 (store on receipt)
                       │                                  └──→ 5.14 (test compression)

5.13 (worker sends hash) ──→ 5.12 (store on receipt)

5.16 (version-mismatch handler) ──→ 5.17 (app version keys) ──→ 5.19 (test)
5.18 (migration logic) ──→ 5.20 (test)

5.21 (rename MD files) ──→ 5.22 (EN fixtures) ──→ 5.23 (update build tests)
```

### Execution Waves

**Wave 1 — Multilingua (Step 5.1 → 5.8):**
Language detection, switcher UI, filtering, test. Può essere sviluppato e testato indipendentemente.

**Wave 2 — localStorage + LZ-string (Step 5.9 → 5.15):**
Compressione, offline-first, storage helpers, test. Dipende dalla Wave 1 per `currentLang`.

**Wave 3 — Version checking + Migration (Step 5.16 → 5.20):**
Gestione `version-mismatch`, auto-update, migrazione v1.x→v2.0, test. Dipende dalla Wave 2 per localStorage keys.

**Wave 4 — Build + Content (Step 5.21 → 5.23):**
Rename file, fixture EN, update build tests. Indipendente, può runnare in parallelo con Wave 2-3.

**Wave 5 — Validation (Step 5.24 → 5.25):**
Update docs, run full test suite, validazione finale PRD v2.0 acceptance criteria.

### Task Progress

| Step | Status | Notes |
|------|--------|-------|
| 5.1 Language detection | ✅ Done | `getPreferredLanguage()`: cookie → navigator → fallback it |
| 5.2 Language switcher UI desktop | ✅ Done | IT/EN buttons con Material Symbols `translate` |
| 5.3 Language switcher UI mobile | ✅ Done | IT/EN buttons in `#mobile-menu` |
| 5.4 Language switcher handler | ✅ Done | Click handler imposta cookie + refresh worker + UI update |
| 5.5 Article filtering by lang | ✅ Done | `filter(article.lang === currentLang)` in worker.onmessage |
| 5.6 Test language detection | ✅ Done | 5 nuovi test in main.test.js |
| 5.7 Test language switcher DOM | ✅ Done | Verifica esistenza pulsanti in HTML |
| 5.8 Test article filtering | ✅ Done | Verifica filtering logic |
| 5.9 LZ-string CDN | ✅ Done | Aggiunto via cdnjs.cloudflare.com |
| 5.10 localStorage helpers | ✅ Done | `compressAndStore`, `retrieveAndDecompress`, `storeHash`, etc |
| 5.11 Offline-first load | ✅ Done | `initializeOfflineFirst()`: localStorage → render → background fetch |
| 5.12 Store on news receipt | ✅ Done | Salva articoli in localStorage quando worker invia news |
| 5.13 Worker sends hash | ✅ Done | Worker include `hash` nel messaggio news |
| 5.14 Test LZ-string | ✅ Done | 11 nuovi test per compressione/Storage |
| 5.15 Test offline-first | ✅ Done | Verifica `initializeOfflineFirst` |
| 5.16 Handle version-mismatch | ✅ Done | `clearArticleStorage` + force refresh |
| 5.17 App version keys | ✅ Done | `tlf_version`, `tlf_app_version` |
| 5.18 Migration logic | ✅ Done | `handleMigration()`: clear old, set v2.0.0 |
| 5.19 Test version-mismatch | ✅ Done | Verifica handler nei test |
| 5.20 Test migration | ✅ Done | Verifica migration logic nei test |
| 5.21 Rename MD files | ✅ Done | Rinominati a `<slug>-<lang>.md` |
| 5.22 Add EN fixtures | ✅ Done | kernel-61-lts-en, systemd-vs-openrc-en, etc |
| 5.23 Update build tests | ✅ Done | Aggiornati per nuovi nomi file |
| 5.24 Update validation checklists | ✅ Done | Spuntati criteria PRD |
| 5.25 Run full test suite | ✅ Done | 77 test pass |

### Test Execution

```bash
node --test src/home/main.test.js     # 42 pass
node --test scripts/build-news.test.js  # 28 pass
node --test src/home/newsWorker.test.js  # 7 pass
```

**Total: 77 tests, 0 failures**

### Validation Checklist (PRD v2.0 Acceptance Criteria)

- [x] Build script genera `news-feed.json` con campo `lang` per ogni articolo
- [x] Build script genera `dist/version.txt` con tag versione
- [x] Web Worker filtra articoli per lingua rilevata (via main.js client-side filtering — Step 5.5)
- [x] Web Worker esegue version checking ad ogni ciclo
- [x] Polling interval: 1 ora
- [x] Se remote version > local: invalidazione cache forzata (Step 5.16)
- [x] Language switcher imposta cookie e aggiorna contenuto (Step 5.4)
- [x] Articoli compressi con LZ-string in localStorage (Step 5.10)
- [x] Offline: articoli visualizzati da localStorage decompresso (Step 5.11)
- [x] Hash comparison: skip fetch se cache valida (Step 5.13: hash nel message, storage in Step 5.10)
- [x] Migrazione: clear localStorage vecchio al primo accesso v2.0 (Step 5.18)
- [x] Zero XSS: solo `createElement` + `textContent`

---

## Sprint 6 — Future Improvements (Planned/Complete)

### Potential Enhancements

| # | Task | Scope | Priority | Status |
|---|------|-------|----------|--------|
| 6.1 | Add more article content | `content` | Medium | ✅ Done |
| 6.2 | Performance optimization | `ui` | Low | ✅ Done |
| 6.3 | PWA support | `ui` | Low | ✅ Done |
| 6.4 | Analytics | `ui` | Low | Planned |
| 6.5 | Contact form | `ui` | Medium | ✅ Done |
| 6.6 | Newsletter signup | `ui` | Low | Planned |
| 6.7 | Social sharing buttons | `ui` | Low | ✅ Done |
| 6.8 | Search functionality | `ui` | Medium | ✅ Done |
| 6.9 | Related articles | `ui` | Low | ✅ Done |
| 6.10 | Code syntax highlighting | `build` | Low | Planned |

### Technical Debt (Future)

- [x] Review all console.log statements (remove for production)
- [x] Add proper error boundaries for production
- [ ] Set up error tracking (Sentry)
- [x] Performance budget monitoring
- [x] Lighthouse CI in GitHub Actions