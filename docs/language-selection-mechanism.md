# Language Selection and Translation Mechanism

This document describes how language detection, selection, and article filtering works.

## Supported Languages

| Code | Language | Build File |
|------|----------|-----------|
| `it` | Italian | `<slug>-it.md` |
| `en` | English | `<slug>-en.md` |

## Detection Priority

The system detects language in this order:

```javascript
function getPreferredLanguage() {
  // 1. Cookie (user preference)
  var langCookie = document.cookie
    .split('; ')
    .find(function(row) { return row.startsWith('tlf_lang='); })
    ?.split('=')[1];
  
  if (langCookie) return langCookie;
  
  // 2. Browser language
  var browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('it')) return 'it';
  if (browserLang.startsWith('en')) return 'en';
  
  // 3. Default to Italian
  return 'it';
}
```

| Priority | Source | Key | Fallback |
|----------|--------|-----|--------|
| 1st | Cookie | `tlf_lang` | — |
| 2nd | Browser | `navigator.language` | — |
| 3rd | Default | — | `it` |

## Language Switcher UI

### Desktop

```html
<!-- index.html -->
<button id="lang-it-btn" aria-label="Switch to Italian">
  <span class="material-symbols-outlined">translate</span>
  <span>IT</span>
</button>
<button id="lang-en-btn" aria-label="Switch to English">
  <span class="material-symbols-outlined">translate</span>
  <span>EN</span>
</button>
```

### Mobile

```html
<button id="lang-it-btn-mobile">...</button>
<button id="lang-en-btn-mobile">...</button>
```

### Button States

| State | CSS Classes |
|-------|------------|
| Active | `border-primary` |
| Inactive | `border-outline-variant/20` |

## Setting Language

When user clicks a language button:

```javascript
function switchLanguage(lang) {
  currentLang = lang;
  setLanguageCookie(lang);              // Persist preference
  worker.postMessage({ type: 'refresh' }); // Refresh news
  updateSwitcherUI(lang);             // Update button states
}
```

### Cookie Storage

```javascript
function setLanguageCookie(lang) {
  document.cookie = 'tlf_lang=' + lang 
    + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/';
}
```

Cookie expires far in the future for persistence across sessions.

## Article Filtering

Articles are stored together but filtered client-side:

```javascript
// worker.onmessage handler
worker.onmessage = function(e) {
  if (e.data.type === 'news') {
    // Store ALL articles for search
    allArticles = e.data.data;
    
    // Filter by current language
    var filteredArticles = e.data.data.filter(function(article) {
      return article.lang === currentLang;
    });
    
    renderArticles(filteredArticles);
  }
};
```

### Filtering Logic

```
news-feed.json (all articles)
    │
    ▼ filter(article.lang === currentLang)
filteredArticles (single language)
    │
    ▼ renderArticles()
UI (DOM)
```

## Build Script Language Support

### File Naming Convention

```
src/raw/kernel-61-lts-it.md   # Italian
src/raw/kernel-61-lts-en.md   # English
```

### Frontmatter

```yaml
---
title: "Kernel 6.1 LTS: Guida Completa"
date: "2024-01-15"
tags: ["linux", "kernel", "lts"]
lang: "it"
---
```

The build script extracts `lang` from frontmatter:

```javascript
// build-news.js
var lang = match.lang || matchFile || 'it';
```

| Field | Source | Default |
|-------|--------|---------|
| `lang` | frontmatter | filename suffix | `it` |

### Output

```json
// dist/news/news-feed.json
{
  "articles": [
    {
      "id": "kernel-61-lts",
      "title": "Kernel 6.1 LTS: Guida Completa",
      "lang": "it",
      ...
    },
    {
      "id": "kernel-61-lts",
      "title": "Kernel 6.1 LTS: Complete Guide",
      "lang": "en",
      ...
    }
  ]
}
```

Each language generates a separate article entry with matching `id`.

## Storage Keys

Language-specific storage ensures separate caches:

| Key | Content |
|----|---------|
| `tlf_articles_it` | Italian articles (LZ-compressed) |
| `tlf_articles_en` | English articles (LZ-compressed) |

```javascript
function STORAGE_KEYS = {
  ARTICLES: function(lang) { 
    return 'tlf_articles_' + lang; 
  }
};
```

## Search and Related Articles

Search and related articles also filter by language:

```javascript
function filterArticles(query) {
  return allArticles.filter(function(a) {
    if (a.lang !== currentLang) return false;  // Filter!
    var title = (a.title || '').toLowerCase();
    return title.includes(q);
  });
}
```

## Benefits

| Feature | Description |
|---------|-------------|
| Persistent | Cookie saves preference |
| Automatic | Browser language detection |
| Instant | Client-side filtering |
| Compact | All languages in one JSON |
| Searchable | All articles available |

## Limitations

- All articles fetched regardless of language
- Client-side filtering (not server-side)
- Single `news-feed.json` contains all languages
- No language in URL path (cookie-based)

## Future Improvements

- URL-based language (`/en/`, `/it/`)
- Server-side filtering
- Localized routing