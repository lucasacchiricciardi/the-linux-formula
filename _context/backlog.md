# The Linux Formula — Backlog tecnico

> Gap analysis generata il 2026-04-21. Spostata in _context/ il 2026-05-04.

## Bug (alto impatto)

### Bug #4 — `setBaseUrl` invia stringa vuota (path rotto su GitHub Pages)
**File:** `src/home/main.js:26`

`worker.postMessage({ type: 'setBaseUrl', baseUrl: '' })` sovrascrive il fallback hardcoded corretto con un path rotto. Fix: non inviare il messaggio se `baseUrl` è vuoto.

### Bug #5 — Race condition potenziale (`unchanged` prima di `initializeOfflineFirst`)
**File:** `src/home/main.js`

Se il Worker risponde `unchanged` prima che `allArticles` sia popolato, il re-render usa `allArticles = []`. Non si manifesta oggi ma è fragile.

## Gap — version checking end-to-end (sprint unico consigliato)

1. **Worker** (`newsWorker.js`): non esegue fetch di `version.txt` — nessun version checking nel ciclo di polling
2. **main.js**: `STORAGE_KEYS` manca `APP_VERSION: 'tlf_app_version'`; `storeVersion()` definita ma mai chiamata
3. **news-feed.json**: manca campo `"version"` top-level (PRD §6.5 lo richiede)

Fix coordinato:
- Aggiungere `APP_VERSION` a `STORAGE_KEYS`
- Chiamare `storeVersion()` dopo `handleMigration()`
- Nel Worker: fetch `version.txt`, confronta, invalida cache se `remoteVersion > localVersion`
- Aggiungere `"version"` al JSON in `buildNewsFeed()`

## Feature mancanti (bassa priorità)

| # | Feature | Note |
|---|---------|-------|
| 6 | Notifica "Benvenuto in v2.0" | `handleMigration()` ritorna `true` ma non mostra nulla |
| 7 | Analytics integration | Marked "Planned" in `docs/progress.md` |
| 8 | Newsletter signup | Marked "Planned" in `docs/progress.md` |
| 9 | Syntax highlighting code block | `<code>` renderizzati plain |
| 10 | Error tracking (Sentry o simile) | Debito tecnico aperto |

## Parzialmente implementato

**Language switcher**: PRD §6.4 specifica flag emoji 🇮🇹 🇬🇧, implementazione usa "IT"/"EN" con Material Symbols `translate`. Funzionalmente corretto — deviazione visiva da confermare.
