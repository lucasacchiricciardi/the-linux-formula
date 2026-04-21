# Product Requirements Document (PRD) - thelinuxformula.com v2.0

> **Version:** 2.0.0 (Breaking Change)  
> **Status:** Active  
> **Last Updated:** 2025-01-20

---

## 1. Obiettivo

Dotare la homepage statica di `thelinuxformula.com` di un sistema dinamico per la visualizzazione degli aggiornamenti (blogpost/news), senza richiedere il ricaricamento della pagina. Il sistema deve elaborare file Markdown in backend e consumarli in frontend tramite Web Worker.

**v2.0 Breaking Changes:**
- Sistema multilingua (Italiano/Inglese) con language switcher
- Persistenza articoli in localStorage con compressione LZ-string

---

## 2. Architettura del Flusso

L'architettura si divide in due macro-fasi disaccoppiate:

1. **Build/Processing (Node.js):** I file Markdown salvati nella cartella `/raw` vengono analizzati, convertiti in JSON strutturato e salvati nella cartella `/dist/news`. Verrà generato un file indice `news-feed.json` contenente i metadati e i contenuti degli articoli. Viene inoltre generato `dist/version.txt` con il tag della versione corrente.

2. **Client-Side (Web Worker):** Un Web Worker istanziato dalla pagina principale esegue:
   - **Version Checking:** Fetch di `version.txt` ad ogni ciclo (1 ora). Se la versione remota è maggiore di quella locale, invalida la cache e forza l'aggiornamento.
   - **News Fetch:** Polling periodico su `news-feed.json`. Se rileva nuovi contenuti rispetto all'ultimo stato locale, scarica i payload e invia un messaggio al Main Thread per l'aggiornamento non distruttivo del DOM.

---

## 3. Requisiti Tecnici

- **Stack:** HTML5, Vanilla JavaScript, Web Workers API, Fetch API, LZ-string. Zero framework frontend pesanti.
- **Directory Structure Obbligatoria:**
  - `src/raw/`: File `.md` originali (separati per lingua).
  - `dist/news/`: Output JSON elaborato.
  - `dist/version.txt`: File versione (tag semver).
- **Web Worker:** Deve gestire esclusivamente il fetch di rete e il parsing dei dati (heavy lifting). Non deve avere accesso diretto al DOM. Esegue version checking ad ogni ciclo.
- **Main Thread:** Deve rimanere reattivo. Riceve messaggi dal Worker (`postMessage`) e aggiorna un container specifico nella UI in modo transizionale.
- **Compressione:** LZ-string per localStorage (best practice browser).
- **Polling:** 1 ora (modificato da 5 minuti).

---

## 4. User Stories

- Come amministratore, voglio depositare file `.md` nella cartella `/raw` sapendo che verranno resi disponibili al client in formato ottimizzato.
- Come visitatore tecnico, voglio vedere i nuovi contenuti apparire sulla pagina in modo asincrono, dimostrando un'architettura frontend efficiente e moderna.
- Come visitatore italiano/inglese, voglio vedere i contenuti nella mia lingua, con possibilità di switchare tramite bandierina.
- Come visitatore, voglio che gli articoli siano disponibili offline dalla seconda visita, senza dover riscaricare.
- Come visitatore, voglio che l'app si aggiorni automaticamente quando viene rilasciata una nuova versione, senza bisogno di refresh manuale.

---

## 5. Scope Validation (Metodo Sacchi)

- *In Scope:* Web Worker setup, Fetch asincrono, DOM Update logic, Build script per MD→JSON, Sistema multilingua, Language switcher, Persistenza localStorage con compressione, Version checking (auto-update), Polling interval 1 ora.
- *Out of Scope:* Sistema di commenti, server-side rendering (SSR), framework reattivi (React/Vue), traduzione automatica.

---

## 6. Sistema Multilingua (v2.0)

### 6.1 Organizzazione Articoli

- File MD separati per lingua con frontmatter: `lang: it` | `lang: en`
- Convenzione naming: `<slug>-<lang>.md`
- Esempi:
  - `src/raw/linux-kernel-61-it.md` (frontmatter: `lang: it`)
  - `src/raw/linux-kernel-61-en.md` (frontmatter: `lang: en`)

### 6.2 Frontmatter Obbligatorio

```yaml
---
title: Titolo Articolo
date: 2025-01-20
tags: [linux, kernel]
lang: it
---
```

### 6.3 Rilevamento Lingua

Priorità di selezione:
1. **Cookie preferenza utente** — se impostato manualmente via bandierina
2. **navigator.language** — rilevamento automatico browser
3. **Fallback** — Italiano (`it`)

Logica:
```
if (cookie exists) → use cookie
else if (navigator.language starts with 'it') → it
else if (navigator.language starts with 'en') → en
else → it (default)
```

### 6.4 UI Language Switcher

- **Posizione:** Nav bar, lato destro, accanto ai link di navigazione
- **Visualizzazione:** Bandierine 🇮🇹 🇬🇧 (cliccabili)
- **Comportamento al click:**
  1. Imposta cookie `tlf_lang` (expires: 1 anno)
  2. Aggiorna localStorage `tlf_lang`
  3. Ricarica contenuto filtrato per nuova lingua
- **Stato attivo:** Bandierina selezionata con bordo/evidenziazione

### 6.5 Build Output

- `news-feed.json` contiene tutti gli articoli con campo `lang`
- Struttura:
```json
{
  "articles": [
    {
      "slug": "linux-kernel-61",
      "title": "Kernel 6.1 LTS Released",
      "date": "2025-01-20",
      "tags": ["linux", "kernel"],
      "lang": "it",
      "content": "Markdown content..."
    }
  ],
  "version": "2.0.0"
}
```
- Worker filtra articoli per lingua rilevata

---

## 7. Persistenza LocalStorage (v2.0 - Breaking Change)

### 7.1 Dati Persistiti

| Chiave | Contenuto | Formato |
|--------|-----------|---------|
| `tlf_articles_{lang}` | Articoli compressi | LZ-string → base64 |
| `tlf_lang` | Lingua corrente | stringa (`it`/`en`) |
| `tlf_hash` | Ultimo hash fetch | stringa SHA-256 |
| `tlf_version` | Versione schema | stringa (`2.0.0`) |
| `tlf_app_version` | Versione app (per auto-update) | stringa (`2.0.0`) |

### 7.2 Compressione

- **Algoritmo:** LZ-string (best practice browser per localStorage)
- **Libreria:** `lz-string` (https://github.com/pieroxy/lz-string)
- **API:**
  - Compressione: `LZString.compressToBase64(string)`
  - Decompressione: `LZString.decompressFromBase64(string)`
- **Ragioni della scelta:**
  - Leggero (~30KB minified)
  - Molto veloce (<5ms per articoli tipici)
  - Nativo supporto UTF-8 (importante per italiano con accenti)
  - Ampiamente testato in produzione

### 7.3 Strategia Cache

```
1. Check localStorage → decomprimi → mostra immediato (offline-first)
2. Fetch background → confronta hash con tlf_hash
3. Se hash diverso:
   - Aggiorna tlf_articles_{lang} (compresso)
   - Aggiorna tlf_hash
   - Invia messaggio al main thread per aggiornamento UI
4. Se hash uguale:
   - Skip (cache hit, nessun aggiornamento)
```

### 7.4 Migrazione da v1.x

- Al primo accesso v2.0: check `tlf_version`
- Se assente o vecchia: clear localStorage (migration)
- Messaggio utente: "Benvenuto in v2.0 — contenuti ottimizzati"

### 7.5 Breaking Changes Documentati

| v1.x | v2.0 |
|------|------|
| Nessuna persistenza | localStorage con compressione |
| Nessun multilingua | Supporto it/en |
| Formato JSON flat | JSON con metadata estesi |
| Hash solo per worker | Hash in localStorage |

### 7.6 Version Checking (Auto-Update)

#### 7.6.1 File Versione

- **Posizione:** `dist/version.txt`
- **Contenuto:** Solo il tag versione (es. `2.0.0`)
- **Formato:** File di testo semplice, nessun JSON

#### 7.6.2 Logica di Controllo

Il Worker esegue un sotto-processo di version checking PRIMA di ogni fetch di news:

```
1. Fetch /version.txt → ottieni versione remota (es. "2.0.1")
2. Leggi tlf_app_version da localStorage (es. "2.0.0")
3. Se remote > local:
   - Invalida cache locale (clear tlf_articles_*)
   - Aggiorna tlf_app_version con nuova versione
   - Forza fetch completo delle news
4. Se remote == local:
   - Usa cache normale (hash comparison)
```

#### 7.6.3 Chiavi localStorage

| Chiave | Contenuto | Note |
|-------|-----------|------|
| `tlf_app_version` | Versione app corrente | Comparata con version.txt |

#### 7.6.4 Polling Interval

- **Intervallo:** 1 ora (modificato da 5 minuti)
- **Primo check:** Al caricamento pagina
- **Razionale:** News non cambiano frequentemente, 1h è sufficiente per bilanciare freshness e performance

#### 7.6.5 Message Protocol Esteso

Il Worker comunica al main thread lo stato del contenuto:

```javascript
// Contenuto invariato (hash uguale) - skip rendering
self.postMessage({ type: 'unchanged' });
```

---

## 8. Componenti e Responsabilità

### 8.1 Build Script (`scripts/build-news.js`)

- Legge file `.md` da `src/raw/`
- Parsa frontmatter (title, date, tags, **lang**)
- Genera `dist/news/news-feed.json`
- Genera `dist/version.txt` con versione corrente (da `package.json` o env)
- Supporta env vars: `BUILD_SRC_HOME`, `BUILD_NEWS_SRC`, `BUILD_DIST`
- Idempotente

### 8.2 Web Worker (`src/home/newsWorker.js`)

- **Polling interval:** 1 ora (modificato da 5 minuti)
- **Sotto-processo: Version Checking**
  - Fetch `dist/version.txt` ad ogni ciclo
  - Confronta con `tlf_app_version` in localStorage
  - Se remote > local: invalida cache + forza update
- **Fetch periodico:** `news-feed.json` (solo se version OK)
- Filtra articoli per lingua
- Calcola SHA-256 hash del feed
- Comunica con main thread via `postMessage`
- **NON** accede a localStorage (delegato al main thread)

### 8.3 Main Thread (`src/home/main.js`)

- Istanzia Web Worker
- Gestisce messaggi: `news`, `unchanged`, `error`
- Gestisce localStorage: compressione/decompressione LZ-string
- Gestisce language switcher: cookie + localStorage
- Hash-based change detection (content unchanged → skip rendering)
- Aggiorna DOM: `createElement` + `textContent` (NO innerHTML)

### 8.4 UI (`src/home/index.html`)

- Container `#news-feed-container`
- Language switcher con bandierine
- Design system: Tailwind CSS (CDN), Material Design 3 tokens

---

## 9. Test Requirements

### 9.1 Build Script
- Parsing frontmatter con lang
- Generazione JSON con tutti i campi
- Idempotenza

### 9.2 Web Worker
- No `window`/`document` globals
- Message protocol: news/unchanged/error
- Hash calculation via crypto.subtle
- Polling interval: 1 ora

### 9.3 Main Thread
- XSS prevention (createElement + textContent)
- LZ-string compression/decompression
- Language detection (cookie → navigator → fallback)
- Language switcher functionality

### 9.4 Integration
- End-to-end: MD → build → JSON → worker → localStorage → DOM
- Offline: visualizzazione da localStorage
- Language switch: cambio lingua e ricarica contenuto

---

## 10. Versioning

- **Schema:** SemVer (`major.minor.patch`)
- **v2.0.0:** Multilingua + localStorage compression + auto-update (✅ COMPLETE - Sprint 5)
- **v1.x.x:** Legacy (non più supportato, localStorage cleared)

---

## 11. Acceptance Criteria

- [x] Build script genera `news-feed.json` con campo `lang` per ogni articolo
- [x] Build script genera `dist/version.txt` con tag versione
- [x] Web Worker filtra articoli per lingua rilevata
- [x] Web Worker esegue version checking ad ogni ciclo
- [x] Polling interval: 1 ora
- [x] Se remote version > local: invalidazione cache forzata
- [x] Language switcher imposta cookie e aggiorna contenuto
- [x] Articoli compressi con LZ-string in localStorage
- [x] Offline: articoli visualizzati da localStorage decompresso
- [x] Hash comparison: skip fetch se cache valida
- [x] Migrazione: clear localStorage vecchio al primo accesso v2.0
- [x] Zero XSS: solo `createElement` + `textContent`

---

## 12. Work-in-Progress Auth Gate (Sprint 7)

### 12.1 Obiettivo

Proteggere il sito con un overlay di autenticazione durante lo sviluppo.
Meccanismo disabilitabile con assenza di file `secret.json`.

### 12.2 Flusso

1. Pagina carica con tutto il contenuto nascosto (`opacity: 0`)
2. Script inline nel `<head>` verifica presenza di `secret.json`
3. Se `secret.json` esiste:
   - Modal overlay fisso mostra "Work in Progress" + input password + bottone "Unlock"
   - Contenuto rimane `opacity: 0`
4. User inserisce password, preme Unlock
5. Script valida contro hash htpasswd nel file `secret.json`
6. Se valida: overlay scompare, contenuto diventa `opacity: 1`
7. Se invalida: messaggio errore, campo rosso, focus reset
8. Se `secret.json` non esiste: overlay non mostrato, `opacity: 1` immediato

### 12.3 File `secret.json`

**Posizione:** `src/secret.json` (dev) → copiato in `dist/secret.json` dal build

**Formato:**
```json
{
  "hash": "$apr1$i724wv6z$csyRYbwLN.YBuXzN2qWi1."
}
```

**Generazione:** https://www.web2generators.com/apache-tools/htpasswd-generator
- Username: `luca` (ignorato, solo per il form online)
- Password: [a scelta] → copia il risultato `username:$apr1$...` → estrai solo hash

### 12.4 Validazione Password

- Libreria: `crypto-js` (CDN, ~20KB gzipped)
  - Algoritmo htpasswd interno: APR1-MD5
  - URL: `https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js`
- Script crea una funzione `verifyApr1Password(plainPassword, aprHash)` che testa matching
- Se match: rimuovi overlay, imposta `sessionStorage['tlf_auth'] = true`

### 12.5 UI Overlay

**CSS inline nel `<head>`:**
```css
body.tlf-auth-required {
  opacity: 0;
  pointer-events: none;
}

.tlf-auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.tlf-auth-modal {
  background: white;
  padding: 2rem;
  border-radius: 0.25rem;
  text-align: center;
  font-family: Inter, sans-serif;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  min-width: 320px;
}

.tlf-auth-modal h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  font-family: 'IBM Plex Serif', serif;
}

.tlf-auth-modal input {
  width: 100%;
  padding: 0.75rem;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 1rem;
  font-family: 'IBM Plex Mono', monospace;
  box-sizing: border-box;
}

.tlf-auth-modal input:focus {
  outline: none;
  border-color: #003f87;
  box-shadow: 0 0 0 3px rgba(0, 63, 135, 0.1);
}

.tlf-auth-modal input.error {
  border-color: #ba1a1a;
  background-color: #ffdad6;
}

.tlf-auth-modal button {
  background: #003f87;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  font-family: Inter, sans-serif;
  width: 100%;
  font-size: 1rem;
}

.tlf-auth-modal button:hover {
  background: #0056b3;
}

.tlf-auth-modal button:active {
  background: #003f87;
}

.tlf-auth-error {
  color: #ba1a1a;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: none;
}

.tlf-auth-error.show {
  display: block;
}
```

### 12.6 Script di Autenticazione (Inline nel `<head>`)

- Carica `secret.json` via fetch asincrono
- Se 404 → nessun overlay (funzionalità disabilitata) → rimuovi `body.tlf-auth-required`
- Se successo → mostra overlay, attach event listeners
- Enter key o click "Unlock" valida password
- On success: sessionStorage impostato, toggle overlay, reset body opacity

### 12.7 Build Script Aggiornamenti

`scripts/build-news.mjs`:
- Se `src/secret.json` esiste → copia in `dist/secret.json`
- Se non esiste → salta (niente nel dist)

### 12.8 Git e Sicurezza

- `src/secret.json` **INCLUSO** nel repo (è una demo/dev password, non produzione)
- Se volessi password real: aggiungi a `.gitignore`, usa env var al build
- Per production-ready: elimina `src/secret.json` dal repo

### 12.9 Acceptance Criteria

- [ ] Script inline nel `<head>` carica `secret.json` prima di DOM render
- [ ] Se `secret.json` assente: nessun overlay, sito visibile subito
- [ ] Se presente: overlay modal centrato con "Work in Progress" + input + bottone
- [ ] Password validata contro APR1-MD5 hash
- [ ] Su success: overlay scompare, contenuto `opacity: 1`, sessionStorage impostato
- [ ] Su error: messaggio rosso, input evidenziato, reset per nuovo tentativo
- [ ] Escape key chiude input (NO unlock — security)
- [ ] Zero XSS: nessun innerHTML, solo textContent
- [ ] Build script copia file se esiste
- [ ] 100% test coverage su validazione e hash matching