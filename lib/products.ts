// The shop's own pieces, each from the owner's photo and label. Photos go through scripts/studio.py into
// public/products/<slug>/; the words follow .claude/skills/leon-product-studio. Weight and ajrat are the label's, never guessed.

import { SHOP } from "./content"; // relative: next.config.ts reads this file for the sitemap

export type Shot ={ src: string; w: number; h: number };
export type Product = {
  slug: string;
  name: string;              // what the piece is called in the shop, e.g. «انگشتر زنانه‌ی برگ»
  kind: string;              // its COLLECTION category: انگشتر، گردنبند و آویز، دستبند، گوشواره، سرویس، سکه و شمش
  collection?: string;       // a named line the piece belongs to, e.g. «مینا دُر»
  line: string;              // one line under the name: what you notice first
  story: string;             // two or three short sentences: how it is made, how it is worn
  weight?: number;           // grams, from the label; until the owner sends it the card shows no weight and no price
  ajrat?: number;            // percent; without it the card shows no price, only «قیمت با تماس»
  details: [string, string][]; // label rows beyond weight and karat: سنگ، سایز، طول، قفل، ...
  shots: Shot[];             // first one is the card
  sold?: boolean;
};

export const PROFIT = 7; // SAMPLE: the shop's profit percent for the estimate, as in the calculator

// retail estimate, the site's formula: gold = w*gp; ajrat = gold*aj; profit = (gold+ajrat)*pf; tax = (ajrat+profit)*10%
export function estimate(p: Product, gp: number) {
  if (!p.ajrat || !p.weight || !gp) return 0;
  const gold = p.weight * gp, aj = gold * p.ajrat / 100, pf = (gold + aj) * PROFIT / 100;
  return gold + aj + pf + (aj + pf) * 0.1;
}

// shared by the cards, the case and each piece's own page (vitrin/<slug>/); plain functions, so server pages can call them too
const faNum = (n: number, d = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: d });
export const gram = (w: number) => faNum(w, 2) + " گرم";
export const kindOf = (p: Product) => p.kind + (p.collection ? "، مجموعه‌ی " + p.collection : "");
export const ask = (p: Product) => SHOP.whatsapp + "?text=" + encodeURIComponent(`سلام، دربارهٔ «${p.name}»${p.weight ? ` (${gram(p.weight)})` : ""} از سایت لئون گلد می‌پرسم.`);
export const codeOf = (p: Product) => p.details.find(([k]) => k === "کد")?.[1];

// Mina d'Or pieces from the owner's posters (2026-10-27), framed without the poster text. Weights and ajrat to come.
export const PRODUCTS: Product[] = [
  // from the owner's raw photo (card in its bag on the counter, 2026-10-27), cut out in the studio
  { slug: "earring-hearts", name: "گوشواره‌ی قلب و گوی", kind: "گوشواره",
    line: "قلبی توخالی با قلب کوچکی کنارش، زیر یک گوی براق.",
    story: "از قلاب، یک پلاک بیضی چکش‌خورده و زنجیری ظریف پایین می‌آید؛ بعد گویی که مثل نگین برق می‌زند و قلبی توخالی که قلب کوچک تختی در آغوش دارد. ظریف و سبک است؛ هم برای هر روز، هم برای هدیه.",
    details: [["قفل", "قلاب"], ["کد", "E39"]],
    shots: [{ src: "/products/earring-hearts/1.webp", w: 1280, h: 1600 }] },
  { slug: "earring-drop", name: "گوشواره‌ی آویز اشک", kind: "گوشواره", collection: "مینا دُر",
    line: "قطره‌ای طلایی با چهار گوی براق، روی دو رشته زنجیر.",
    story: "دو رشته زنجیر نازک از قلاب پایین می‌آید و یک قطره‌ی طلا را نگه می‌دارد؛ دورش نقش پیچ حک شده و پایینش چهار گوی ریز برق می‌زند. بلند است و با هر حرکت سر تکان می‌خورد؛ با موی جمع‌شده بیشتر دیده می‌شود.",
    details: [["قفل", "قلاب"], ["ساخت", "آویز بلند، دو رشته زنجیر"]],
    shots: [{ src: "/products/earring-drop/1.webp", w: 1280, h: 1600 }, { src: "/products/earring-drop/2.webp", w: 1280, h: 1600 }] },
  { slug: "necklace-disc", name: "گردنبند پلاک گرد", kind: "گردنبند و آویز", collection: "مینا دُر",
    line: "پلاک گرد با نقش پیچ، روی حلقه‌های درشت و زنجیر ظریف.",
    story: "زنجیر ظریف با مکعب‌های کوچک و پلاک‌های بیضی شیاردار جلو می‌آید و در وسط به حلقه‌های درشت می‌رسد که پلاک گرد را نگه می‌دارند. بلند است؛ روی یقه‌ی باز یا لباس ساده‌ی یک‌رنگ خوب می‌نشیند.",
    details: [["پلاک", "گرد، با نقش پیچ"], ["زنجیر", "ظریف، با حلقه‌های درشت در وسط"]],
    shots: [{ src: "/products/necklace-disc/1.webp", w: 1280, h: 1600 }, { src: "/products/necklace-disc/2.webp", w: 1280, h: 1600 }] },
  { slug: "earring-clover", name: "گوشواره‌ی شبدر", kind: "گوشواره", collection: "مینا دُر",
    line: "گلی از چهار قلب با یک نگین، و شبدر چهاربرگ زیرش.",
    story: "از قلاب، زنجیر کوتاهی پایین می‌آید؛ اول گلی که از چهار قلب توخالی ساخته شده و وسطش نگین کوچکی نشسته، بعد شبدر چهاربرگ تخت. سبک است و برای هر روز.",
    details: [["قفل", "قلاب"], ["نگین", "یک نگین کوچک وسط گل"]],
    shots: [{ src: "/products/earring-clover/1.webp", w: 1280, h: 1600 }] },
];
