# Unresolved — Gap Analysis v2.0

> Nota per lo sviluppatore — generata il 2026-04-21 dall'analisi della codebase vs PRD.

---

## Mancante (alto impatto)

### 1. Worker: version checking assente
**File:** `src/home/newsWorker.js`  
**PRD:** §7.6, §8.2 — acceptance criterion #4

Il Worker non esegue mai il fetch di `dist/version.txt`. Il ciclo di polling va direttamente a `news-feed.json` senza:
- confrontare la versione remota con `tlf_app_version` in localStorage
- invalidare la cache se `remoteVersion > localVersion`
- aggiornare `tlf_app_version` dopo il refresh

Il criterio di accettazione *"Web Worker esegue version checking ad ogni ciclo"* non è soddisfatto.

---

### 2. `tlf_app_version` key assente in main thread
**File:** `src/home/main.js:104`  
**PRD:** §7.1, §7.6.3

`STORAGE_KEYS` non include `APP_VERSION` (`tlf_app_version`). La funzione `storeVersion()` è definita ma **mai chiamata** nel codice. La key `tlf_version` usata in `handleMigration()` serve al versioning dello schema localStorage, non al version checking dell'app.

---

### 3. `news-feed.json` manca il campo `"version"` top-level
**File:** `scripts/build-news.mjs:128-130`  
**PRD:** §6.5 — schema JSON feed

La funzione `buildNewsFeed()` restituisce `{ articles: sorted }`. Il campo `"version"` specificato nel PRD è assente:

```json
// atteso
{ "articles": [...], "version": "2.0.0" }

// attuale
{ "articles": [...] }
```

`version.txt` viene generato separatamente, ma il feed JSON non è allineato allo schema.

---

## Bug nascosti

### 4. `setBaseUrl` invia stringa vuota (path rotto su GitHub Pages)
**File:** `src/home/main.js:26`

```javascript
worker.postMessage({ type: 'setBaseUrl', baseUrl: '' });
```

Il Worker riceve `baseUrl = ''` e costruisce `FETCH_URL = '' + '/news/news-feed.json'` = `/news/news-feed.json`.  
Questo **sovrascrive il fallback hardcoded corretto** (`/the-linux-formula/news/news-feed.json`) con un path rotto su GitHub Pages (dove il sito è servito sotto `/the-linux-formula/`).

Fix: passare il `baseUrl` corretto o non inviare il messaggio se il valore è vuoto.

---

### 5. Race condition potenziale — `unchanged` prima di `initializeOfflineFirst()`
**File:** `src/home/main.js` (worker.onmessage + initializeOfflineFirst)

Se il Worker risponde `{ type: 'unchanged' }` prima che `initializeOfflineFirst()` abbia popolato `allArticles`, il re-render usa `allArticles = []`. In pratica il flusso è sincrono quindi non si manifesta, ma la dipendenza implicita rende il codice fragile a refactoring futuri.

Fix: verificare che `allArticles` sia popolato prima di eseguire il re-render nell'handler `unchanged`.

---

## Mancante (bassa priorità / pianificato)

| # | Feature | Note |
|---|---------|-------|
| 6 | Notifica "Benvenuto in v2.0" | `handleMigration()` ritorna `true` ma non mostra nulla all'utente (PRD §7.4) |
| 7 | Analytics integration | Marcato "Planned" in `docs/progress.md` |
| 8 | Newsletter signup | Marcato "Planned" in `docs/progress.md` |
| 9 | Syntax highlighting code block | Blocchi `<code>` renderizzati plain, senza highlight |
| 10 | Error tracking (Sentry o simile) | Debito tecnico aperto in `docs/progress.md` |

---

## Parzialmente implementato

### 11. Language switcher — visual spec vs implementazione
**PRD:** §6.4 specifica flag emoji 🇮🇹 🇬🇧  
**Implementazione:** usa testo "IT" / "EN" con icona Material Symbols `translate`

Funzionalmente corretto (cookie, state highlight, filtering). La deviazione visiva potrebbe essere intenzionale dato il design system Material Design 3 adottato — da confermare con il designer.

---

## Azioni suggerite

I gap #1, #2, #3 e il bug #4 sono strettamente correlati (version checking end-to-end). Si consiglia di affrontarli in un unico sprint:

1. Aggiungere `APP_VERSION: 'tlf_app_version'` a `STORAGE_KEYS` in `main.js`
2. Chiamare `storeVersion()` al termine di `handleMigration()` / init
3. Nel Worker: fetch `version.txt` ad ogni ciclo, confrontare, invalidare cache se necessario
4. Aggiungere `"version"` al JSON restituito da `buildNewsFeed()` in `build-news.mjs`
5. Correggere `setBaseUrl` per non inviare stringa vuota
