# Prompt di Fase: Implementazione Modulo News (Vanilla JS & Local Build)

> **Regola fondamentale:** *Safety first, little often, double check*
> Leggere `[ROOT_PROGETTO]/export/prd.md` prima di iniziare.

## 1. Prompt di Fase (Scope of Work)
Implementare un sistema asincrono per la gestione delle news basato esclusivamente su HTML5, CSS3 e Vanilla JS. Il flusso prevede uno script locale per la conversione statica dei file Markdown e un Web Worker client-side che interroga i dati compilati per aggiornare la UI della homepage senza bloccare il main thread. Nessun tool di automazione esterno (n8n) è previsto.

## 2. Prompt Tecnico (Implementazione & Vincoli)
Esegui i seguenti task seguendo il ciclo TDD rigoroso (RED -> GREEN -> REFACTOR):

### Task 2.1: Local Build Script (`scripts/build-news.js`)
- Crea un semplice script Node.js (da eseguire in locale prima del deploy).
- Lo script deve leggere tutti i file `.md` nella cartella `src/raw/`.
- Deve estrarre i contenuti (e gli eventuali frontmatter/metadati) e generare un file unificato `news-feed.json` all'interno della cartella `dist/news/`.
- Lo script deve essere essenziale, senza richiedere dipendenze pesanti se non i moduli nativi `fs` e `path` (o un parser MD leggerissimo se strettamente necessario per l'HTML).

### Task 2.2: Web Worker (`src/home/newsWorker.js`)
- Crea un Web Worker in puro Vanilla JS.
- Implementa una logica di `fetch` verso `/news/news-feed.json` (che in produzione sarà servito da GitHub Pages).
- Implementa un meccanismo di caching o controllo dell'hash/timestamp locale per verificare se ci sono effettivi aggiornamenti prima di disturbare il main thread.
- Utilizza `self.postMessage()` per inviare i payload aggiornati (o le differenze) al thread principale.

### Task 2.3: Main Thread Integration (`src/home/main.js`)
- Istanzia il Web Worker nel file principale.
- Implementa l'event listener `worker.onmessage` per intercettare i nuovi dati JSON.
- Crea una funzione di DOM injection sicura (prevenzione XSS) per renderizzare gli articoli all'interno di un container con id `#news-feed-container` nel file `index.html`.
- Usa solo API DOM native (`document.createElement`, `textContent`, ecc.). Nessun framework.

## 3. Prompt di Validazione (Criteri di Successo)
Prima di considerare concluso il task e procedere con i commit, verifica:
- [ ] **Build Locale:** Eseguendo `node scripts/build-news.js`, il file `dist/news/news-feed.json` viene generato o aggiornato correttamente partendo dai file in `src/raw/`.
- [ ] **Isolamento Worker:** Il file `newsWorker.js` utilizza unicamente API compatibili con l'ambiente Worker (niente accessi a `window` o `document`).
- [ ] **Gestione Errori:** Il worker gestisce i fallimenti di rete (es. file JSON non trovato o offline) senza far crashare l'app, comunicando l'errore al main thread.
- [ ] **Documentazione SDD:** I file `bug_ledger.md`, `architecture.md` e `progress.md` sono stati aggiornati.
- [ ] **Git Flow:** Eseguito Conventional Commit atomico con aggiornamento contestuale di `githistory.md`.