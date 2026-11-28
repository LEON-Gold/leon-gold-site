// node scripts/defer-scripts.mjs <out dir> — after a static export, turn the page's async <script src> tags into defer.
// Why (2026-11-28, «خطای React» on leongold.net): with async, a chunk sometimes runs and React starts hydrating while the
// browser is still reading the rest of the page, sees a half-built body, throws error #418 and renders the whole page
// again (the boot script's data-theme is lost with it). Deferred scripts run, in order, only once the page is fully read.
// Measured on the item page: 3 of 20 loads failed with async, 0 of 30 with defer.
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) { console.error("usage: node scripts/defer-scripts.mjs <out dir>"); process.exit(1); }
let files = 0, tags = 0;
const walk = d => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n), st = fs.statSync(f);
  if (st.isDirectory()) { if (n !== "_next") walk(f); continue; }
  if (!n.endsWith(".html")) continue;
  const s = fs.readFileSync(f, "utf8");
  let k = 0; const t = s.replace(/<script src="([^"]+)" async="">/g, (_, src) => { k++; return `<script src="${src}" defer="">`; });
  if (k) { fs.writeFileSync(f, t); files++; tags += k; } } };
walk(dir);
console.log(`defer-scripts: ${tags} script tags in ${files} pages`);
