# Team di Agenti Specializzati - Definizione

## Panoramica

Team strutturato per sviluppo progressivo del progetto **thelinuxformula.com**. Workflow basato su micro-sprint iterativi con TDD e double-check. Gerarchia: **Pensanti** (thinking model) → **Esecutori** (instructed model). Interfaccia unica: `@orchestrator`.

## Regole Fondamentali

1. **Safety first** — validazione rigorosa prima di ogni modifica
2. **Little often** — micro-sprint atomici, mai big-bang
3. **Double check** — validazione incrociata tra agenti
4. **Caveman mode** — risposte terse, sostanza tecnica, zero filler
5. **sequential-thinking** — uso obbligatorio per organizzazione lavoro
6. **context7** — consultazione documentazione prima di scrivere codice

---

## Struttura del Team

### @orchestrator (Coordinatore Principale)

**Ruolo**: Interfaccia unica con l'utente. Supervisione globale, definizione obiettivi sprint, prioritizzazione.

**Responsabilità**:
- Definizione perimetro micro-sprint
- Coordinamento tra tutti i sub-agenti
- Validazione deliverable a fine sprint
- Approvazione passaggio sprint successivo

**Model**: `opencode-go/glm-5.1` (thinking)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

## Agenti Pensanti (Thinkers)

Ogni pensante ha responsabilità distincta, nessun overlap. Sotto ciascuno: esecutori per competenza specifica.

### @pensante-architecture

**Ruolo**: Spec-Driven Architecture. Definisce specifiche tecniche rigorose PRIMA di qualsiasi codice.

**Responsabilità**:
- Traduce requisiti sprint in specifiche tecniche dettagliate
- Definisce struttura dati, API contracts, nodi, payload
- Aggiorna `docs/architecture.md`
- Coordina @executer-build e @executer-test

**Model**: `opencode-go/glm-5.1` (thinking)

**Sub-agenti esecutori**:
- @executer-implementation → implementa specifiche
- @executer-test → scrive test TDD

**Tools**: `write: false`, `edit: false`, `bash: ask` — read-only, solo analisi

---

### @pensante-security

**Ruolo**: Security Audit continuo. Validazione sicurezza in ogni iterazione.

**Responsabilità**:
- Verifica isolamento dati (XSS prevention)
- Control hardcoded secrets nel codice
- Audit accessi, permessi, credenziali
- Blocca rilasci se criticità

**Model**: `opencode-go/glm-5.1` (thinking)

**Sub-agenti esecutori**:
- @executer-security-audit → esegue audit
- @executer-security-fix → applica fix

**Tools**: `write: false`, `edit: false`, `bash: ask` — read-only

---

### @pensante-design

**Ruolo**: Design System. Definizione UI/UX secondo design tokens existing.

**Responsabilità**:
- Traduce requisiti in specifiche UI/UX
- Definisce componenti, layout, color tokens
- Coordina @executer-ui per implementazione
- Valida aderanza a Material Design 3 tokens

**Model**: `opencode-go/glm-5.1` (thinking)

**Sub-agenti esecutori**:
- @executer-ui → implementa componenti
- @executer-visual → assets visuali (logo, icone)

**Tools**: `write: false`, `edit: false`, `bash: ask` — read-only

---

### @pensante-integration

**Ruolo**: Connettività e flussi dati. Gestione API, worker, build pipeline.

**Responsabilità**:
- Implementa connessioni esterne (API, CDN, GitHub Pages)
- Coordina flussi dati main ↔ worker
- Gestisce build script e deploy pipeline
- Valida idempotenza build

**Model**: `opencode-go/glm-5.1` (thinking)

**Sub-agenti esecutori**:
- @executer-build → build script
- @executer-worker → web worker logic

**Tools**: `write: false`, `edit: false`, `bash: ask` — read-only

---

## Agenti Esecutori (Executors)

Modello `instructed` per esecuzione task specifici. Ricevono istruzioni da pensanti.

### @executer-implementation

**Ruolo**: Implementazione codice secondo specifiche.

**Responsabilità**:
- Traduce specifiche in codice funzionante
- RED → GREEN → REFACTOR
- Segue Vanilla JS constraints (zero npm dependencies frontend)

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

### @executer-test

**Ruolo**: Test-Driven Development.

**Responsabilità**:
- Scrive tests FALLIMENTARI prima implementazione (RED)
- Validazione GREEN/refactor
- Coverage verification

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

### @executer-security-audit

**Ruolo**: Esecuzione audit sicurezza.

**Responsabilità**:
- Scansione codice per vulnerabilità
- Verifica XSS prevention (innerHTML → createElement/textContent)
- Control secrets in codice

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: false`, `edit: false`, `bash: ask` — read-only

---

### @executer-security-fix

**Ruolo**: Applicazione fix sicurezza.

**Responsabilità**:
- Applica fix identificati da @pensante-security
- Verifica fix non introduca regressioni

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

### @executer-ui

**Responsabilità**: Implementazione componenti UI.

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

### @executer-visual

**Responsabilità**: Assets visuali, icone, graphic.

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: ask` — accesso limitato

---

### @executer-build

**Responsabilità**: Build script e pipeline.

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

### @executer-worker

**Responsabilità**: Web Worker logic.

**Model**: `github-copilot/grok-code-fast-1` (instructed)

**Tools**: `write: true`, `edit: true`, `bash: true` — full access

---

## Skill Requirements

Ogni agente avrà skill installate via **universal-skills-manager**:

| Agente | Skill necessarie |
|--------|-------------|
| @orchestrator | gsd-manager, gsd-progress |
| @pensante-architecture | gsd-plan-phase, gsd-research-phase |
| @pensante-security | gsd-audit-fix, gsd-secure-phase |
| @pensante-design | gsd-ui-phase, gsd-ui-review |
| @pensante-integration | gsd-integration-checker |
| @executer-.* | gsd-fast, gsd-quick |

---

## Workflow Sprint

### Fase 1: Planning
@orchestrator definisce obiettivo → @pensante-architecture scrive specifiche

### Fase 2: Implementation
@executer-implementation + @executer-test eseguono TDD

### Fase 3: Security
@pensante-security audit → @executer-security-fix applica fix

### Fase 4: Design
@pensante-design valida UI → @executer-ui implementa

### Fase 5: Integration
@pensante-integration valida flussi → @executer-build + @executer-worker

### Fase 6: Commit
@orchestrator approva → deliverable completato

---

## MCP Usage

- **sequential-thinking**: Obbligatorio per ogni decisione non trivile
- **context7**: Consultare documentazione PRIMA di scrivere codice

---

## Configurazione .opencode/opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "model": "opencode-go/glm-5.1",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "pensante-architecture": {
      "mode": "subagent",
      "model": "opencode-go/glm-5.1",
      "description": "Spec-Driven Architecture",
      "tools": {
        "write": false,
        "edit": false,
        "bash": "ask"
      }
    },
    "pensante-security": {
      "mode": "subagent",
      "model": "opencode-go/glm-5.1",
      "description": "Security Audit",
      "tools": {
        "write": false,
        "edit": false,
        "bash": "ask"
      }
    },
    "pensante-design": {
      "mode": "subagent",
      "model": "opencode-go/glm-5.1",
      "description": "Design System",
      "tools": {
        "write": false,
        "edit": false,
        "bash": "ask"
      }
    },
    "pensante-integration": {
      "mode": "subagent",
      "model": "opencode-go/glm-5.1",
      "description": "Integration & Data Flow",
      "tools": {
        "write": false,
        "edit": false,
        "bash": "ask"
      }
    },
    "executer-implementation": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "Code Implementation",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "executer-test": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "TDD Tests",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "executer-security-audit": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "Security Audit Execution",
      "tools": {
        "write": false,
        "edit": false,
        "bash": "ask"
      }
    },
    "executer-security-fix": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "Security Fixes",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "executer-ui": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "UI Implementation",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "executer-visual": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "Visual Assets",
      "tools": {
        "write": true,
        "edit": true,
        "bash": "ask"
      }
    },
    "executer-build": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "Build Scripts",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "executer-worker": {
      "mode": "subagent",
      "model": "github-copilot/grok-code-fast-1",
      "description": "Web Worker",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    }
  }
}
```

---

## Note

- @orchestrator è l'UNICA interfaccia con l'utente
- Sub-agenti comunicano solo via @orchestrator
- Nessun overlap di responsabilità tra pensanti
- sequential-thinking USATO PER OGNI decisione
- context7 consultato PRIMA di scrivere codice