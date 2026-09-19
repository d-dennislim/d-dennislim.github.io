# Portfolio — Project Context

## Current State

Personal portfolio site, freshly scaffolded. Single-page layout: sticky left column (name, title, tagline, nav, social links) + scrolling right column (About, Experience, Projects sections). Currently on branch `refactor/v2`.

**Stack**: Vite 8, React 19, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), oxlint.

**Structure**:
- `src/data/content.ts` — all copy/data (personal info, nav items, about paragraphs, experience, projects, social links). Single source of truth; components just map over it.
- `src/components/` — `Header`, `About`, `Experience`, `Projects`.
- `src/App.tsx` — layout shell + scroll-spy logic (`activeSection` state via scroll listener) to highlight the active nav item.

**Known gaps / unfinished items**:
- About/project copy in `content.ts` is generic placeholder text — needs real content (actual projects, real project URLs/images, `/resume.pdf` referenced but not present in `public/`).
- SEO is thin: only a basic `<meta description>` + title. No Open Graph/Twitter card tags, no canonical URL, no `og:image`, no JSON-LD (`Person` schema), no `robots.txt`/`sitemap.xml`.
- No CI/deploy workflow — footer previously implied AWS S3 as a deploy target (now removed); no GitHub Actions config exists yet.
- No tests, no analytics.
- Favicon is SVG-only, no PNG fallback set.

## Migration Plan: Astro

Decision: migrate this site to Astro before content is finalized (no commits yet, so this is the cheapest point to do it).

**Why**: the site is 100% static content — no auth, no API calls, no per-user state. Astro ships zero JS by default and only hydrates components that need the browser, versus a full React SPA runtime for what is otherwise static markup. Meaningfully smaller JS bundle, faster TTI/LCP, and content is guaranteed crawlable without relying on JS execution.

**Migration shape**:
- `content.ts` carries over as-is (Astro supports plain TS imports natively) — no data model changes needed.
- `Header`, `About`, `Experience`, `Projects` become static `.astro` components (no client JS at all).
- The scroll-spy (`activeSection`) logic in `App.tsx` moves to a small inline `<script>` or a minimal island — same behavior, no framework needed for it.
- Tailwind config carries over unchanged conceptually (swap `@tailwindcss/vite` for the Astro Tailwind/Vite integration).

**Sequencing**: do the Astro migration first, then layer the baseline improvements (finish placeholder content, SEO metadata, CI/deploy workflow, accessibility polish, favicon set, analytics) on top of the Astro version rather than doing it twice.

## Baseline Improvement Checklist (post-migration)

1. Replace all placeholder content in `content.ts` (real about copy, real project links/images, add real resume PDF or remove the link).
2. Add SEO metadata: Open Graph + Twitter card tags, canonical URL, `og:image`, JSON-LD `Person` schema, `robots.txt` + `sitemap.xml`.
3. Add a GitHub Actions workflow to build and deploy to S3/CloudFront on push to `main`.
4. Add PNG favicon fallbacks alongside the existing SVG.
5. Optional: privacy-friendly analytics (Plausible/Umami) instead of GA.
