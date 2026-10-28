// Puts a museum photograph into the dark room: pixels that are not gold-coloured (the grey or white studio ground)
// fade to the page ground, so each piece sits in the darkness without a frame. Writes public/museum/dark/<name>.webp.
// Usage: node scripts/darkroom.mjs <file in public/museum> [...]
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const BG = [6, 20, 14]; // --bg #06140e
const MAX = +(process.env.MAX || 1600);
const MIN_S = +(process.env.MIN_S || 0.2); // raise for a warm-toned studio ground
const out = "public/museum/dark";
fs.mkdirSync(out, { recursive: true });

const clamp = (x) => Math.max(0, Math.min(1, x));
for (const f of process.argv.slice(2)) {
  const { data, info } = await sharp(path.join("public/museum", f)).resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, s = mx ? d / mx : 0;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    // gold and its shadows: warm hue (12-62°) with real saturation; everything else is ground
    const warm = h >= 12 && h <= 62 ? 1 : h > 62 && h < 80 ? (80 - h) / 18 : h > 0 && h < 12 ? h / 12 : 0;
    const a = clamp((s - MIN_S) / 0.18) * warm;
    for (let k = 0; k < 3; k++) px[i + k] = Math.round(BG[k] + (data[i + k] - BG[k]) * a);
  }
  const name = path.basename(f).replace(/\.[^.]+$/, ".webp");
  // crop to the piece, then give it an even margin of darkness (12% of its longer side)
  const trimmed = await sharp(px, { raw: { width: info.width, height: info.height, channels: 3 } }).trim({ background: { r: BG[0], g: BG[1], b: BG[2] }, threshold: 18 }).toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.12);
  const framed = await sharp(trimmed.data, { raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 3 } }).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: BG[0], g: BG[1], b: BG[2] } }).toBuffer();
  // WebP no longer than 1600 px: the static build serves the file as it is, to phones too
  await sharp(framed).resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(out, name));
  console.log(name, info.width + "x" + info.height);
}
