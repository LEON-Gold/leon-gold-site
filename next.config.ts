import type { NextConfig } from "next";

// PREVIEW_BASE builds a static copy for a preview link on GitHub Pages (see scripts/preview.sh);
// the real site (Iranian hosting) builds without it.
const preview = process.env.PREVIEW_BASE;

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
