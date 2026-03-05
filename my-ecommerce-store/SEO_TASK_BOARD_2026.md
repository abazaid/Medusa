# SEO Task Board 2026 (Medusa + Storefront)

## Scope
- Market: Saudi Arabia
- Languages: Arabic (default) + English
- Platform: Medusa v2 + Next.js storefront
- Official Brand:
  - EN: Vape Hub KSA
  - AR: مركز الفيب السعودي
  - Tagline EN: Your Vaping Hub in Saudi Arabia
  - Tagline AR: مركزك لكل ما يخص الفيب
  - Domain: https://vapehubksa.com

## Phase Plan

| Phase | Task | Priority | Status | Owner Notes |
|---|---|---:|---|---|
| 1 | HTTPS + canonical baseline review | P0 | In Progress | base URL + canonical on key pages implemented; redirects audit pending |
| 1 | XML sitemap (index + locale split) | P0 | Done | sitemap.xml index -> sitemap-ar.xml + sitemap-en.xml + image-sitemap.xml |
| 1 | robots.txt + indexation rules | P0 | Done | robots points to sitemap index; cart/account/checkout noindex + query blocks active |
| 1 | Locale URL architecture (`/ar` default, `/en`) | P0 | Done | middleware redirects `/sa/*` -> `/ar/*`, locale switcher in header |
| 1 | Search Console + GA4 integration hooks | P0 | Done | optional NEXT_PUBLIC_GSC_VERIFICATION + NEXT_PUBLIC_GA_MEASUREMENT_ID wired |
| 1 | Blog system in Medusa (admin + store API + storefront) | P0 | Done | module + migration + admin page + store pages |
| 2 | Core Web Vitals pass (LCP/FID/CLS) | P0 | In Progress | image formats/cache + next/image roll-out started |
| 2 | Structured Data: Product/Breadcrumb/Organization/FAQ/ItemList/BlogPosting | P0 | Done | Product + Breadcrumb + Organization + FAQ + ItemList + BlogPosting active |
| 2 | Breadcrumb UX/Schema everywhere | P1 | Done | visible breadcrumbs + breadcrumb schema on core public pages |
| 3 | Title/Meta rules enforcement (all entities) | P0 | In Progress | locale alternates/hreflang + canonical self implemented on key pages |
| 3 | URL policy and redirect hygiene | P1 | Done | middleware normalizes uppercase, duplicate slashes, and trailing slashes |
| 3 | Image optimization policy (format, size, alt) | P1 | In Progress | AVIF/WebP + cache TTL + next/image on blog/brand/home brand tiles |
| 3 | Internal linking system | P1 | In Progress | product/category/blog breadcrumbs + contextual internal links added |
| 4 | Product descriptions 300+ words | P1 | Pending | generator + QA |
| 4 | Category content 500+ words | P1 | Pending | intro + buying guide |
| 4 | Topic authority hubs (no writing yet) | P1 | Done | architecture route `/landing` + bilingual hub pages ready |
| 4 | SEO landing pages framework | P1 | Done | dynamic bilingual landing templates at `/landing/[handle]` |

## Detailed Execution Order
1. Finish index/noindex controls and canonical/hreflang coverage.
2. Complete schema coverage and validate JSON-LD outputs.
3. Continue CWV optimization pass and image optimization expansion.
4. Build structured content framework (landing pages + hubs) before content writing.

## Remaining External Inputs
- Google Search Console property verification value (if not set yet).
- GA4 Measurement ID (if analytics tracking should be activated).
- Decision on content generation workflow for 300+ word products and 500+ word categories.
