# Bug Ledger

> Track resolved bugs with symptom, cause, and prevention.

## 2026-04-20: Worker ES module export causes SyntaxError in browser

**Symptom:** News feed never loads. No error shown in UI. Worker instantiation fails silently.
**Cause:** `export { computeHash }` on line 46 of `newsWorker.js`. Classic Workers (`new Worker('newsWorker.js')`) do not support ES module syntax. The `export` statement throws `SyntaxError` at Worker creation, preventing any code from executing.
**Fix:** Removed `export { computeHash }` from `newsWorker.js`. The test suite already duplicates `computeHash` locally — no import needed.
**Prevention:** Never use `export`/`import` in Workers unless `new Worker(..., { type: 'module' })` is explicitly used. Add a source-code test that rejects `export` in Worker files.

## 2026-04-20: Duplicate Material Symbols font link

**Symptom:** Browser loads `Material+Symbols+Outlined` stylesheet twice (line 12 and 13 in index.html). Wasted network request and parse time.
**Cause:** Copy-paste error during initial HTML authoring.
**Fix:** Removed the duplicate `<link>` tag.
**Prevention:** Visual review of `<head>` during PR; consider linting for duplicate `<link href>`.

## 2026-04-20: Invalid HTML from markdownToHtml — block elements inside `<p>`

**Symptom:** Generated HTML contains `<p><h2>...</h2></p>` and `<br>` inside `<ul>`. Browsers auto-correct but invalid HTML may cause accessibility issues.
**Cause:** Original `markdownToHtml` function used regex replacements that wrapped everything in `<p>` tags, then split on `\n\n` — causing headings and lists to be wrapped in paragraphs.
**Fix:** Rewrote `markdownToHtml` as a block-level parser: splits input into blocks (headers, lists, paragraphs) and wraps each appropriately. Headers get standalone tags, list items are grouped into `<ul>`, paragraphs are `<p>`-wrapped.
**Prevention:** Add unit tests verifying output HTML is valid (no `<p><h*` patterns, no `<br>` inside `<ul>`).

## 2026-04-20: Deploy workflow used peaceiris/actions-gh-pages (third-party)

**Symptom:** GitHub Actions warning about Node.js 20 deprecation; `peaceiris/actions-gh-pages@v5` does not exist (v4 is the latest).
**Cause:** Initial workflow used `peaceiris/actions-gh-pages@v4` to push to a `publish` branch, requiring GitHub Pages configured as "Deploy from a branch". This is the legacy approach.
**Fix:** Replaced with official GitHub Pages actions: `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` in a two-job pipeline (build → deploy). GitHub Pages Source changed to "GitHub Actions" in repo Settings.
**Prevention:** Use official `actions/*` for Pages deployment; avoid third-party actions for core CI/CD when official alternatives exist.