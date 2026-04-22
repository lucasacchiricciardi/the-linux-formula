# ADR-1: LogWhispererAI Subpage Implementation

## Context
The project requires a new subpage `/logwhispererai` to promote the LogWhispererAI Micro-SaaS product. The page must follow the conversion sequence (Hero, Problem/Agitation, Solution, Social Proof, Offer) as defined in the PRD (docs/prd.md Section 13). It must integrate with the existing site's design system (Concept C "The Formula"), reuse existing Tailwind CSS configuration, and maintain static HTML5/Tailwind implementation without additional frameworks. The subpage needs to be accessible from the main navigation and comply with SEO targets for keywords: "Linux Log Analyzer AI", "Troubleshooting Server Linux", "Metodo Sacchi".

## Decision
Create a static HTML page at `src/logwhispererai/index.html` that:
1. Mirrors the base structure of `src/home/index.html` (same head metadata, Tailwind CDN, font preconnects, and script for auth gate if needed, but simplified for subpage).
2. Implements the five sections as per PRD:
   - Hero section with bilingual headline (EN/IT), sub-headline, and primary CTA button linking to the form.
   - Problem & Agitation section displaying a realistic log snippet in a terminal-styled box.
   - Solution section highlighting the Metodo Sacchi with three feature highlights (Traduzione Umana, Comando Risolutivo, Sicurezza).
   - Social Proof section with authority badge and language disclaimer.
   - Offer section with a waitlist form (placeholder for Tally) requesting email, number of servers, and log upload.
3. Uses existing design tokens:
   - Fonts: IBM Plex Serif for headings (font-headline), Inter for body (font-body), IBM Plex Mono for labels and log snippets (font-label).
   - Color palette: surface, primary, primary-container, surface-container-low/lowest/highest, on-surface, on-surface-variant, outline, outline-variant, error.
   - Layout: max-w-7xl mx-auto container, responsive grid (lg:grid-cols-12), consistent spacing and padding patterns from home page.
   - Visual signature: no rounded corners on interactive elements, border accent pattern (border-l-4 border-primary), 40px grid overlay background, Material Symbols Outlined icons with appropriate variants.
4. Includes SEO optimizations:
   - Title tag: "LogWhispererAI - AI-Powered Linux Log Analyzer | The Linux Formula"
   - Meta description: tailored to include target keywords.
   - Header structure (H1, H2, H3) with keyword-rich copy.
   - Semantic HTML5 sections and ARIA labels where appropriate.
   - Open Graph tags for social sharing.
5. Integrates with navigation by adding a "LogWhispererAI" link in the main nav (desktop and mobile) pointing to `/logwhispererai/`, matching the existing link to YouTube but changing the URL and label.
6. Does not require JavaScript for core functionality (static form action placeholder), but may include minimal enhancement for interactions if needed later.
7. Will be built into `dist/logwhispererai/index.html` by extending the build script (`scripts/build-news.js`) to copy the subpage assets, or via a dedicated build step if preferred.

## Consequences
- Positive: 
  - Consistent user experience and visual fidelity with the main site.
  - Straightforward implementation using existing patterns reduces risk and development time.
  - SEO-friendly structure improves discoverability for target keywords.
  - Clear conversion flow aligns with PRD objectives.
  - Easy to maintain and update as part of the static site.
- Negative:
  - Slight increase in build complexity to handle additional subpage.
  - Requires careful attention to avoid duplicating head metadata; could be mitigated with a shared template in future.
  - Static form lacks real backend integration (placeholder only) until connected to Tally or similar service.
- Neutral:
  - The subpage will be treated as a separate entity in the site structure but shares global CSS/JS resources.
  - Future enhancements (like dynamic language switching) can be added incrementally.

