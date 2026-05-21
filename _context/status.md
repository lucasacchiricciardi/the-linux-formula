# The Linux Formula — Status

## Stato
🟢 OPERATIVO — sito live, GDPR completo, Matomo integrato

## Sviluppo
- **Dev machine**: 192.168.254.79 — `Sources/LucaSacchiNet/the-linux-formula/`
- **Repo**: GitHub — deploy automatico su GitHub Pages

## Prossima azione
Backlog tecnico in `_context/backlog.md` — priorità: bug #4 (setBaseUrl stringa vuota) + version checking end-to-end (#1-3).

## Componenti
| Componente | Stato |
|---|---|
| Sito statico (GitHub Pages) | ✅ live |
| iubenda cookie consent | ✅ attivo su tutte le pagine |
| Matomo siteId=2 | ✅ tracking post-consenso |
| Opt-out link | ✅ in footer |
| Privacy policy (iubenda) | ✅ |
| Cookie policy (iubenda) | ✅ |
| Termini e condizioni (iubenda) | ✅ |
| LogWhispererAI landing | ✅ live |
| RSS feed (feed.xml) | ✅ live |
| OneSignal Web Push (appId 3a81f143) | ✅ integrato |
| In-app toast (nuovi articoli) | ✅ attivo |
| Paginazione blog (PAGE_SIZE=6) | ✅ Prev/Next desktop, Load More mobile |

## Ultimo aggiornamento
2026-05-21 — WIP password gate ripristinato: `src/secret.json` rimosso da gitignore (era stato ignorato da commit 2026-05-16 "security(auth)"), file committato con hash APR1 per pwd "luca". Fix corruzione `.gitignore` (Thumbs.db concatenato con il path del file). Deploy GitHub Pages confermato, modal "Enter password" verificato con Playwright. Backlog tecnico invariato.
