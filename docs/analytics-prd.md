# Prodotto: LimesAnalytics (Spec-Driven PRD)
**Versione:** 1.0.0  
**Stato:** Draft - Spec-Driven Phase  
**Data:** 21 Aprile 2026  
**Autore** Luca Sacchi Ricciardi
**Diritti** Tutti i diritti riservati

## 1. Obiettivi e Visione
Realizzare un sistema di web analytics leggero che emuli le metriche core di Google Analytics (Pageviews, Events, Sessions, Heatmaps) senza l'uso di cookie, utilizzando esclusivamente il `localStorage` con dati compressi. Il sistema deve garantire l'esenzione dal banner dei cookie tramite anonimizzazione nativa e gestione dei dati *First-Party*.

---

## 2. Specifiche Funzionali (User Stories)
* **Tracking Base:** Come admin, voglio monitorare le visualizzazioni di pagina e la provenienza (referrer) in forma aggregata.
* **Interazione:** Come admin, voglio mappare i click e lo scroll (heatmaps) per ottimizzare la UX senza identificare il singolo utente.
* **Efficienza:** Come sviluppatore, voglio che il sistema non impatti sulle performance e rispetti il limite dei 5MB del `localStorage`.
* **Privacy:** Come utente, voglio che i miei dati siano anonimi e che il mio IP venga mascherato a livello applicativo prima del salvataggio.

---

## 3. Specifiche Tecniche & Data Model
Il sistema adotta un approccio **Spec-Driven**. Prima dell'implementazione, i test (TDD) devono validare la correttezza della compressione e dell'anonimizzazione.

### 3.1 Architettura dello Storage
I dati vengono salvati in una struttura JSON serializzata e compressa tramite l'algoritmo **LZ-String** (ottimizzato per LocalStorage).

**Schema Dati (Esempio):**
```json
{
  "s": "12345", // Session ID (Hash temporaneo, ruota ogni 30 min)
  "v": [        // Views
    {"p": "/home", "t": 1672531200, "r": "google.com"}
  ],
  "e": [        // Events
    {"n": "button_click", "l": "cta_main", "t": 1672531210}
  ],
  "h": [        // Heatmap (Coordinate x,y aggregate)
    {"x": 120, "y": 450, "c": 1}
  ]
}
```

### 3.2 Vincoli di Compressione & Rotazione
* **Compressione:** Ogni blocco di 10 eventi viene compresso in una stringa base64.
* **Batching:** I dati vengono inviati al server (se presente) ogni 5 minuti o al `beforeunload`.
* **Cleanup:** I dati nel `localStorage` devono essere eliminati dopo l'invio riuscito o dopo 24 ore di persistenza (Retention Rule).

---

## 4. Vincoli di Conformità (GDPR & Garante 2026)
Per essere classificato come **strumento tecnico esente da consenso**, il sistema deve rispettare rigorosamente questi vincoli:

1.  **IP Masking:** L'indirizzo IP deve essere troncato (es. `192.168.x.x`) lato client/server prima di qualsiasi elaborazione.
2.  **No Cross-Domain:** Il sistema non deve condividere dati tra domini diversi (no ID di tracciamento universali).
3.  **Input Masking (Heatmaps):** Le mappe di calore non devono registrare input di testo o aree contenenti dati personali (campi password, nomi, email).
4.  **First-Party Ownership:** Il codice JS e l'endpoint di ricezione dati devono risiedere sullo stesso dominio del sito o su sottodominio proprietario.
5.  **Trasparenza:** Obbligo di inserire nella Privacy Policy il paragrafo relativo all'uso del Web Storage per fini statistici anonimi.

---

## 5. Workflow di Sviluppo (TDD & Git)
Seguendo le linee guida del Titolare:

### 5.1 Strategia di Branching
* `main`: Codice stabile pronto per la produzione.
* `develop`: Integrazione delle feature.
* `feat/*`, `fix/*`: Branch tematici.

### 5.2 Conventional Commits
Ogni commit deve seguire lo standard:
* `feat(core): implement lz-string compression for events`
* `test(privacy): add test case for IP masking logic`
* `docs(changelog): update version for release 1.0.0`

### 5.3 Common Changelog
Il file `CHANGELOG.md` deve essere aggiornato ad ogni release seguendo le categorie: **Added, Changed, Deprecated, Removed, Fixed, Security**.

---

## 6. Acceptance Criteria (Double Check)
* [ ] Il peso dello script JS è inferiore a 10KB (Gzipped).
* [ ] Il sistema non genera chiamate a domini di terze parti.
* [ ] I dati nel `localStorage` sono illeggibili senza decompressione (sicurezza base).
* [ ] Il test di "IP Leak" fallisce (ovvero l'IP non viene mai inviato intero).
* [ ] La Privacy Policy è aggiornata con i riferimenti al `localStorage`.

---

> **Nota di Sicurezza (Sacchi Rules):** > 1. **Safety First:** Assicurati che lo script non possa essere iniettato via XSS per leggere altri dati del localStorage. 
> 2. **Little Often:** Commit piccoli e frequenti per monitorare l'evoluzione della logica di compressione. 
> 3. **Double Check:** Verifica manualmente i log del database per assicurarti che non ci siano dati personali "sfuggiti" all'anonimizzazione.
