import type { NextConfig } from "next";
import { mkdirSync, writeFileSync } from "node:fs";
import { glFiles } from "./lib/guilloche";
import { COLLECTION } from "./lib/content";

// PREVIEW_BASE builds a static copy for a preview link on GitHub Pages (see scripts/preview.sh);
// the real site (Iranian hosting) builds without it.
const preview = process.env.PREVIEW_BASE;

// the guilloché patterns as files in public/gl/ (generated, not committed), written before every dev and build
mkdirSync("public/gl", { recursive: true });
for (const [name, body] of Object.entries(glFiles(COLLECTION.length))) writeFileSync(`public/gl/${name}`, body);

// robots.txt and sitemap.xml (generated too: route segment config cannot sit beside cacheComponents); the panel and «حساب من» carry noindex, so they stay crawlable
const site = (process.env.SITE_URL || "https://leon-gold.github.io/leon-gold-app/site/").replace(/\/?$/, "/");
const slash = preview ? "/" : "";
const pages = ["", "museum" + slash];
const today = new Date().toISOString().slice(0, 10);
writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`);
writeFileSync("public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);

const nextConfig: NextConfig = {
  // partial prerendering cannot run in a static export
  ...(preview ? {} : { cacheComponents: true, partialPrefetching: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(preview ? { output: "export" as const, basePath: preview, trailingSlash: true, images: { unoptimized: true } } : {}),
};

export default nextConfig;
