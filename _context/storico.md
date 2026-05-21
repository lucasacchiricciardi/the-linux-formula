# The Linux Formula — Decisioni prese

## 2026-05-03 — GDPR: iubenda + Matomo + analytics.js rimosso
- Sostituito analytics.js (localStorage client-side, niente GDPR) con Matomo self-hosted
- Integrato iubenda cookie consent banner su tutte le pagine (siteId 2315562)
- Matomo JS wrappato in callback `onConsentGiven` — zero tracking prima del consenso
- Aggiunto link opt-out nel footer di tutte le pagine
- GDPR wrapping verificato con Playwright: nessuna richiesta a matomo.php prima del consenso
- IP admin (151.20.60.179) escluso dal tracking su Matomo siteId=2
- Rimosso analytics.js e analytics.test.mjs (codice morto)

## 2026-05-04 — Sistema notifiche: RSS, OneSignal, Toast, Paginazione

- **SITE_URL** aggiornato da GitHub Pages a `https://thelinuxformula.com`
- **RSS feed.xml** generato da build-news.mjs (articoli IT, RSS 2.0)
- **OneSignal Web Push** integrato (appId 3a81f143-4817-4244-bd61-38148604d269); bell icon in nav desktop e mobile
- **In-app toast** con animazione slideIn; rilevazione nuovi articoli via hash comparison nel worker.onmessage
- **Paginazione blog**: PAGE_SIZE=6, Prev/Next su desktop, Load More su mobile
- **feed.xml** aggiunto a ASSETS_TO_CACHE nel Service Worker
- Deploy su GitHub Pages (f29e9b7)

## 2026-05-21 — Ripristino WIP password gate

- Identificato che il commit `security(auth)` del 2026-05-16 aveva spostato `src/secret.json` in `.gitignore`, disabilitando silenziosamente il gate (il build script non trovava il file → nessun `dist/secret.json` → auth bypass automatico)
- Rimosso `src/secret.json` da `.gitignore`; fixata anche corruzione della riga (Thumbs.db era concatenato con il path senza newline)
- Committato `src/secret.json` con hash APR1 per password "luca" (salt: test1234)
- Deploy GitHub Actions completato (1m46s), modal "Enter password" verificato con Playwright

## Aperto
- Backlog tecnico: bug #4 (setBaseUrl stringa vuota) + version checking end-to-end (#1-3)
