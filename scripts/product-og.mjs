// The share card of each showcase piece (WhatsApp, Telegram, search): its first shot set in the middle of a 1200x630
// vault ground lit from behind, with gold hairlines either side. Writes public/products/<slug>/og.jpg.
// Usage: node scripts/product-og.mjs [slug ...]   (no slug: every folder in public/products)
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const W = 1200, H = 630, DIR = "public/products";
const ground = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="#1a5a42"/><stop offset=".55" stop-color="#0d3a2a"/><stop offset="1" stop-color="#06140e"/></radialGradient>
  <linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#c59a50" stop-opacity="0"/><stop offset=".5" stop-color="#e8cf8e"/><stop offset="1" stop-color="#c59a50" stop-opacity="0"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="60" y="${H / 2}" width="300" height="1" fill="url(#l)"/><rect x="${W - 360}" y="${H / 2}" width="300" height="1" fill="url(#l)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="14" fill="none" stroke="#c59a50" stroke-opacity=".45"/>
</svg>`);

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(DIR).filter((d) => fs.existsSync(path.join(DIR, d, "1.webp")));
for (const s of slugs) {
  const h = H - 48 - 24; // inside the hairline frame
  const shot = await sharp(path.join(DIR, s, "1.webp")).resize({ height: h }).toBuffer();
  const { width } = await sharp(shot).metadata();
  // the shot's own vault edges fade into the card's ground
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}"><defs>
    <linearGradient id="x"><stop offset="0" stop-color="#000"/><stop offset=".3" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <linearGradient id="y" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="v"><rect width="100%" height="100%" fill="url(#y)"/></mask></defs>
    <rect width="100%" height="100%" fill="#000"/><rect width="100%" height="100%" fill="url(#x)" mask="url(#v)"/></svg>`);
  const faded = await sharp(shot).joinChannel(await sharp(mask).greyscale().toBuffer()).png().toBuffer();
  await sharp(ground).composite([{ input: faded, left: Math.round((W - width) / 2), top: 36 }]).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(DIR, s, "og.jpg"));
  console.log(s + "/og.jpg");
}
