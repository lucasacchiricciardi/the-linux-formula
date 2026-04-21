# LimesAnalytics — Documentazione Tecnica

## Panoramica

LimesAnalytics è un sistema di web analytics leggero (< 10KB), **senza cookie**, che utilizza esclusivamente `localStorage` per memorizzare i dati di tracciamento. È conforme GDPR grazie all'anonimizzazione nativa.

---

## Architettura

### Flusso dei Dati

```
Utente → Pagina → analytics.js (init) → localStorage ←→ Admin (debug)
                ↓
          Worker/Polling (futuro: invio a backend)
```

### Storage

| Chiave localStorage | Contenuto | Formato |
|-------------------|----------|--------|
| `tlf_analytics` | Dati compressi | LZ-string → base64 |

---

## Struttura Dati

```javascript
{
  "s": "abc12345",        // Session ID (8 char hex)
  "v": [                 // Views (max 100)
    { "p": "/", "t": 1672531200, "r": "google.com" }
  ],
  "e": [                 // Events (max 200)
    { "n": "click", "l": "cta-main", "v": null, "t": 1672531210 }
  ],
  "ts": 1672531200       // Session start timestamp
}
```

### Campi

| Campo | Tipo | Descrizione |
|-------|------|-----------|
| `s` | string | Session ID temporaneo (ruota ogni 30 min) |
| `v` | array | Pageview con page, timestamp, referrer |
| `e` | array | Eventi con name, label, value, timestamp |
| `ts` | number | Inizio sessione |

---

## Session Management

### Generazione Session ID

```javascript
function generateSessionId() {
  var arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Rotazione

- **Durata**: 30 minuti (`SESSION_DURATION = 30 * 60 * 1000`)
- **Trigger**: Nuovo ID generato se `now - sessionStart > SESSION_DURATION`
- **Conservazione**: ID cambiato ad ogni nuova pagina/evento maNON ogni pageview

---

## Tracking

### Pageview

```javascript
trackPageview(page, referrer)
// page: string (path, default: location.pathname)
// referrer: string (default: document.referrer)
```

**Comportamento:**
1. Carica dati da localStorage
2. Aggiorna session ID (se scaduto)
3. Aggiunge entry a `v[]`
4. Limita a 100 pageview ( FIFO )
5. Salva in localStorage (compresso)

### Eventi

```javascript
trackEvent(name, label, value)
// name: string (es: 'click', 'scroll')
// label: string (es: 'cta-main')
// value: any (opzionale)
```

**Eventi tracciati automaticamente:**
- `click` — su elementi con attributo `data-analytics`
- `scroll` — profondità massima (0-100%)

### Elementi tracciabili

```html
<button data-analytics="cta-main">Contattami</button>
<a href="/about" data-analytics="nav-about" data-analytics-label="Menu About">About</a>
```

---

## Compressione

### Libreria

- **LZ-string** (già disponibile nel progetto per le news)
- **API**: 
  - `LZString.compressToBase64(json)` → string
  - `LZString.decompressFromBase64(compressed)` → json

### Why LZ-string?

- Leggera (~3KB)
- Veloce (<5ms per chunk tipico)
- UTF-8 nativo (importante per italiano)
- Già in use nel progetto

---

## Privacy & GDPR

### Conformità

| Requisito | Implementazione |
|----------|----------------|
| No cookie | Solo localStorage |
| No IP | Mai salvato |
| First-party | Solo dominio proprietario |
| Anonimizzazione | Session ID casuale, no PII |
| Minimizzazione | Solo dati aggregati |

### Esenzione Cookie

Secondo il GDPR e le linee guida del Garante (2026), questo sistema **non richiede consenso** perché:
1. È tecnicamente necessario per il funzionamento
2. Non identifica l'utente
3. Non lascia dati sul dispositivo dell'utente dopo la chiusura
4. I dati sono solo statistici e aggregati

---

## API Pubblica

### Esposizione

```javascript
window.LimesAnalytics = {
  trackPageview,  // (page, referrer) → void
  trackEvent,      // (name, label, value) → void
  getData,       // () → Object
  getStats,      // () → { sessionId, pageviews, events, uniquePages }
  clearData      // () → void
};
```

### Usage

```javascript
// Manual tracking
window.LimesAnalytics.trackEvent('form_submit', 'contact');

// Stats (per admin)
const stats = window.LimesAnalytics.getStats();
// { sessionId: 'abc', pageviews: 12, events: 5, uniquePages: { '/': 8, '/about': 4 } }

// Debug
const data = window.LimesAnalytics.getData();
// { s: 'abc', v: [...], e: [...] }
```

---

## Limiti

| Limite | Valore | Note |
|-------|-------|------|
| Pageview | 100 | FIFO older removed |
| Events | 200 | FIFO older removed |
| localStorage | ~5MB | Browser limit |
| Sessione | 30 min | Rotazione ID |

---

## Development

### Debug locale

```javascript
// Console browser
console.log(window.LimesAnalytics.getStats());
console.log(window.LimesAnalytics.getData());
console.log(localStorage.getItem('tlf_analytics'));

// Decomprimere dati
const compressed = localStorage.getItem('tlf_analytics');
const json = LZString.decompressFromBase64(compressed);
const data = JSON.parse(json);
```

---

## Roadmap

| Feature | Stato | Note |
|---------|-------|------|
| Pageview tracking | ✅ | |
| Click events | ✅ | |
| Scroll depth | ✅ | |
| Session management | ✅ | |
| Invio a backend | ❌ | Opzionale, webhook configurabile |
| Heatmaps | ❌ | Out of scope v1 |
| Real-time dashboard | ❌ | Out of scope v1 |

---

## File

- `src/home/analytics.js` — Script principale
- `src/home/analytics.test.mjs` — Test TDD
- `docs/analytics-prd.md` — PRD originale