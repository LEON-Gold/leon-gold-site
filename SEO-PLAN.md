# Search and AI-search plan (owner, 2026-11-16)

Order set by the /court verdict on the GEO guide (8–4 "not as described"): lock the private pages, then the free
registrations, then content only with a named writer. No money on articles or backlinks until the numbers below say
search brings customers.

## 1. Private pages out of search — done 2026-11-16
- `robots.txt` (generated in `next.config.ts`) disallows `/daftar/`, `/hesab/`, `/panel/`.
- The server sends `X-Robots-Tag: noindex, nofollow, noarchive` on those three (`leon-gold-server/web.mjs`, tested).

## 2. Free registrations — waiting for the owner
- Google Search Console: add `https://leongold.net` (owner's Google account). Settings → Search generative AI →
  "Include my site's links and content". Submit `https://leongold.net/sitemap.xml`.
- Bing Webmaster Tools: import from Search Console, submit the sitemap.
- Verification: the owner sends the meta-tag code; it goes into `app/layout.tsx` (`metadata.verification`).

## 3. Baseline, target, check date
- Baseline 2026-11-16 (the site's own counter, started 2026-11-15): 2 visitors / 5 views today; most views are
  `/hesab/` (customers), not search.
- Measure: weekly visitors to the public pages (`/`, `/vitrin/`, `/museum/`), and once registered, Search Console and
  Bing impressions and clicks, Bing «AI Performance» citations.
- Check date: 2026-12-16. Decide then whether articles are worth a writer's time.

## 4. Content — needs a writer named by the owner
- Proposal: one short article a week answering a real customer question, written by a Claude tab from facts the owner
  gives. No invented claims, prices, reviews or statistics.
- Run `/seo-geo https://leongold.net` (read-only audit) after step 2; apply fixes only with the owner's approval.
