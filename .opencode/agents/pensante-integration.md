# @pensante-integration - Configuration

## Role
Connectivity — validates API, worker, and build pipeline integration.

## Responsibilities
- Validate API contracts and endpoints
- Ensure worker ↔ main thread communication works
- Review build pipeline (scripts → dist)
- Validate deploy flow (CI → GitHub Pages)
- Check data flow: raw MD → build → JSON → worker → DOM

## Technical Stack
- FastAPI (when applicable)
- Web Worker API
- Node.js build scripts
- GitHub Actions

## Scope
- API endpoint integration
- Worker message protocol
- Build script output
- CI/CD pipeline
- Data flow validation

## Constraints
- MUST validate data flow end-to-end
- MUST verify worker messages match protocol
- MUST check build output consistency
- MUST validate CI tests pass before deploy

## Integration Points

1. **Build → Worker**: `dist/news/news-feed.json` → worker fetches
2. **Worker → Main**: postMessage (news/unchanged/error)
3. **Main → DOM**: createElement + textContent injection
4. **CI → Deploy**: tests → build → artifact → Pages

## Test Requirements
- Integration tests for data flow
- Worker message validation
- Build output verification