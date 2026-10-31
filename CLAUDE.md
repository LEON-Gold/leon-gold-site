@AGENTS.md

# Working on the Leon Gold showcase site

- The owner writes in Persian and checks on an iPhone (Safari). Reply in Persian; the phone layout is first-class.
- Act without asking first, then report. Look at screenshots (390 and 1440 wide) before every publish.
- This folder is only the public site. The ledger app lives in `../leon-gold` and its phone build in `../leon-gold-app`; don't touch them from here except `../leon-gold-app/site/` (the preview copy).

## Where it runs

- Preview: https://leon-gold.github.io/leon-gold-app/site/ (static export copied into `../leon-gold-app/site`).
- Real hosting will be Iranian (Liara or ArvanCloud) once the owner has an account and a domain. Then: the site at `/`, the CRM panel at `/panel`, the ledger at `/daftar`.

## Scripts (Git Bash)

- `bash scripts/check.sh` — clean build (`rm -rf .next` first: the Turbopack cache serves stale CSS), `next start` on :3100, taste inspector.
- `bash scripts/publish.sh "<message>"` — static preview build, push `../leon-gold-app/site`, commit and push this repo. It stops the :3100 server; rerun check.sh afterwards.
- `powershell -File scripts/shot.ps1 -Urls "url|out.png;..." -Wait 6000 -W 390 -H 844` — headless Chrome screenshots. Only ever stop the test Chrome by its profile, never all Chrome.
- `node scripts/darkroom.mjs` — fades the grey ground of museum photos to the vault colour (`public/museum/dark/`, WebP).
- `public/t.html?s=<selector>&o=<offset>` scrolls to a section for a screenshot; `t2.html` opens the exhibit case. Neither is published.
- Preview build quirks: `MSYS2_ENV_CONV_EXCL=PREVIEW_BASE` (Git Bash rewrites the path), no `cacheComponents` in export mode.

## Design: the ledger's "Assay Ledger" look

- Emerald vault (`#06140e`, `#0d3a2a`), gold leaf gradient text, ivory paper cards with a gold hairline and corner ornaments, guilloché drawn in `lib/guilloche.ts`.
- Amiri ("LG Naskh") for display, Vazirmatn for text, Cinzel for Latin. Persian digits everywhere.
- The taste inspector flags gradients, shadows and hairlines; those are the brand the owner asked for, keep them.

## Business rules

- Prices come from the Tehran gold union feed (`price.json` on the `price` branch of LEON-Gold/leon-gold-app, raw → jsDelivr → tgju).
- Retail estimate: `gold = w*gp; ajrat = gold*aj; profit = (gold+ajrat)*pf; tax = (ajrat+profit)*10%`. Mithqal = gram × 4.3318.
- Contact details, collection, ajrat and profit in `lib/content.ts` are SAMPLE until the owner sends real ones. Never invent reviews, customers or statistics.
- No online payment yet: orders go to WhatsApp until the CRM exists.

## «حساب من» at `/hesab` (customers and suppliers)

- `components/hesab/Hesab.tsx`, `lib/hesab.ts`, `app/hesab/`. Read-only; data from the server's portal API (see `../leon-gold-server/CLAUDE.md`). Customers: balance, orders, statement. Suppliers: balance, the open order items given to them (no customer names), statement. A party that is both sees both.
- Sign-in: SMS code (off until a Kavenegar account exists; the page then offers a WhatsApp request for a link) or the owner's one-time link `hesab/#k=…`. `hesab/#demo` shows a sample account, marked as one.
- Balances are never converted at today's price; positive = the party owes Leon, worded for the reader («بدهی شما به لئون» / «طلب شما از لئون»).
- Order and work lines show the product's own photo, fetched with the party's token (`/api/portal/photo/:id`), never a public URL. Customers can send a card-to-card receipt photo (shrunk on the phone, amount in toman sent as rial ×10); it stays PENDING and moves no balance. The panel's «امروز» lists pending receipts read-only.
- No owner tools on public pages (owner, 2026-10-31): invite links, signing a party out and closing receipts live only in the ledger's owner-only «کاربران». The old `hesab/#owner` page is gone. «حساب من» and /panel read only the ledger's synced data (the panel's own `crm_*` notes aside).
