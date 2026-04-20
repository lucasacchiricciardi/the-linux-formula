# @executer-build - Configuration

## Role
Build Script & Pipeline — implements build scripts and CI/CD pipeline.

## Responsibilities
- Implement build scripts in `scripts/`
- Generate `dist/news/news-feed.json` from MD files
- Copy HTML/JS assets to dist/
- Maintain CI/CD pipeline in `.github/workflows/`
- Ensure idempotent builds

## Technical Stack
- Node.js (native modules only: fs, path)
- GitHub Actions
- Shell scripts

## Scope
- `scripts/build-news.js` implementation
- `dist/` generation
- `.github/workflows/deploy.yml`
- Build environment configuration

## Constraints
- MUST use Node native modules only (no npm dependencies)
- MUST be idempotent (re-running produces consistent output)
- MUST support env vars for custom paths:
  - `BUILD_SRC_HOME`
  - `BUILD_NEWS_SRC`
  - `BUILD_DIST`
- MUST copy index.html, main.js, newsWorker.js to dist/
- MUST generate news-feed.json from src/raw/*.md

## Build Script Requirements

### Input
- Read `.md` files from `src/raw/`
- Parse frontmatter (title, date, tags)
- Extract content after frontmatter

### Output
- `dist/news/news-feed.json`:
```json
[
  {
    "title": "Article Title",
    "date": "2024-01-01",
    "tags": ["linux", "kernel"],
    "content": "Markdown content..."
  }
]
```
- Copy `src/home/index.html` → `dist/`
- Copy `src/home/main.js` → `dist/`
- Copy `src/home/newsWorker.js` → `dist/`

## CI Pipeline

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/build-news.js
      - run: node --test scripts/*.test.js
      - uses: actions/upload-pages-artifact@v3
        with: path: dist/
      - uses: actions/deploy-pages@v4
```