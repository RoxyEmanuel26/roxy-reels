# roxy-reels (www.missav-j.com) — SEO / Site Audit notes

## Tech stack
- Static SPA hosted on **Cloudflare Pages**. Client rendering in `assets/js/` (ES modules, `?v=X.Y.Z` cache-bust query on imports).
- Dynamic routes served by Cloudflare Pages Functions: `functions/[[catchall]].js` (SEO tag injector for crawlers), `functions/api/*`.
- `_routes.json` decides which paths hit the Worker vs. static assets.
- Localized routes are `/<lang>/...` for 13 languages. Language keys: `zh-TW, zh-CN, en, ja, ko, ms, th, de, fr, vi, id, fil, pt`.

## i18n / hreflang architecture
- **Source of truth for languages**: `assets/js/i18n.js` → `LANGS` array + `getLang()` (reads first URL path segment, falls back to `localStorage`/`en`).
- Runtime `<head>` SEO tags (canonical, alternates, OG) are injected by `updateSEOTags()` in `assets/js/app.js` on every SPA route change.
- Sitemaps are emitted by THREE generators that must stay in sync:
  - `generate_sitemap.js` (Node CLI, pulls actors/categories/videos from external API + Supabase — needs network + `SUPABASE_URL`/`SUPABASE_KEY` env; can't run in sandbox).
  - `api/sitemap.js` and `functions/api/sitemap.js` (runtime Cloudflare versions; nearly identical to each other).
  - Committed static XML lives in `sitemaps/*.xml` (actors split into 4 files, plus categories/studios/videos/pages). `robots.txt` → `sitemaps/sitemap_index.xml`.

### hreflang code mapping (Ahrefs fix, 2026-07)
- Ahrefs validates hreflang strictly against **ISO 639-1**. The internal key `fil` (ISO 639-2) is invalid there → must emit `tl` (ISO 639-1 Tagalog/Filipino).
- Introduced `HREFLANG_CODE_MAP = { fil: 'tl' }` + `hreflangCode()` in each emitter. **URL paths keep `/fil/`** — only the `hreflang="..."` attribute value changes.
- If you add a language whose internal key isn't a valid ISO 639-1 code, add it to `HREFLANG_CODE_MAP` in ALL emitters (i18n.js, generate_sitemap.js, api/sitemap.js, functions/api/sitemap.js).

## Known Ahrefs Site Audit issues (project 10157215, crawl 2026-07-27, health 6.96)
- **FIXED (this branch)**: "Hreflang and HTML lang mismatch" (1,749) — `<html lang>` was frozen at `id` from `index.html`; `updateSEOTags()` now sets `document.documentElement.lang`.
- **FIXED (this branch)**: "Hreflang annotation invalid / Incorrect value" (1,749) — invalid `fil` hreflang code, now mapped to `tl`.
- **STILL OPEN** (not touched): Orphan pages (1,749 indexable), Non-canonical page in sitemap (2), Title/meta length warnings (~133), IndexNow notice (1,750), plus minor redirect/sitemap notices.

## Edge cases / gotchas
- `index.html` line 2 has a static `<html lang="id">` — that's just the pre-JS default; the crawler reads the JS-updated value. Don't hardcode a different fixed lang there.
- Regenerating sitemaps from scratch requires external API + Supabase access. For code-only hreflang changes, transform the committed XML deterministically (`hreflang="fil"` → `hreflang="tl"`) — byte-identical to a regen for that change.
