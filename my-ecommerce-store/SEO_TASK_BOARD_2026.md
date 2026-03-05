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
| 1 | HTTPS + canonical baseline review | P0 | Pending | verify env/base URL + redirects |
| 1 | XML sitemap + image sitemap | P0 | Done | sitemap.xml + image-sitemap.xml implemented |
| 1 | robots.txt + indexation rules | P0 | In Progress | robots + noindex for cart/account/checkout implemented |
| 1 | Search Console + GA4 integration hooks | P0 | Pending | config + docs + env |
| 1 | **Blog system in Medusa (admin + store API + storefront)** | P0 | **Done** | module + migration + admin page + store pages |
| 2 | Core Web Vitals pass (LCP/FID/CLS) | P0 | Pending | audit + optimization |
| 2 | Structured Data: Product/Breadcrumb/Organization/FAQ/ItemList/BlogPosting | P0 | In Progress | product/category/brand partially present |
| 2 | Breadcrumb UX/Schema everywhere | P1 | Pending | product/category/blog |
| 3 | Title/Meta rules enforcement (all entities) | P0 | Pending | strict fallback strategy |
| 3 | URL policy and redirect hygiene | P1 | Pending | lowercase, hyphen, 301 rules |
| 3 | Image optimization policy (format, size, alt) | P1 | Pending | webp + lazy loading + naming |
| 3 | Internal linking system | P1 | Pending | product ↔ category ↔ brand ↔ blog |
| 4 | Product descriptions 300+ words | P1 | Pending | generator + QA |
| 4 | Category content 500+ words | P1 | Pending | intro + buying guide |
| 4 | Topic authority hubs (no writing yet) | P1 | Planned | architecture + templates only |
| 4 | SEO landing pages framework | P1 | Planned | dynamic landing model + template |

## Detailed Execution Order
1. Finish Blog module + admin section + store pages + SEO metadata.
2. Add robots.txt and sitemap endpoints (including blog + image sitemap).
3. Add index/noindex control for cart/checkout/account/search/filter pages.
4. Add full schema coverage and validate JSON-LD output.
5. Start CWV performance pass.

## Current Milestone (Started)
- Blog data model fields include SEO:
  - `handle`, `status`, `title_ar/en`, `excerpt_ar/en`, `content_ar/en`
  - `meta_title_ar/en`, `meta_description_ar/en`, `canonical_url`, `cover_image`, `published_at`
- Admin route planned at `Admin > Blog` for CRUD.
- Store routes planned:
  - `/store/blog`
  - `/store/blog/[handle]`
