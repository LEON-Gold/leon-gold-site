// The shop's own pieces, each from the owner's photo and label. Photos go through scripts/studio.py into
// public/products/<slug>/; the words follow .claude/skills/leon-product-studio. Weight and ajrat are the label's, never guessed.

export type Shot = { src: string; w: number; h: number };
export type Product = {
  slug: string;
  name: string;              // what the piece is called in the shop, e.g. «انگشتر زنانه‌ی برگ»
  kind: string;              // its COLLECTION category: انگشتر، گردنبند و آویز، دستبند، گوشواره، سرویس، سکه و شمش
  line: string;              // one line under the name: what you notice first
  story: string;             // two or three short sentences: how it is made, how it is worn
  weight: number;            // grams, from the label
  ajrat?: number;            // percent; without it the card shows no price, only «قیمت با تماس»
  details: [string, string][]; // label rows beyond weight and karat: سنگ، سایز، طول، قفل، ...
  shots: Shot[];             // first one is the card
  sold?: boolean;
};

export const PROFIT = 7; // SAMPLE: the shop's profit percent for the estimate, as in the calculator

// retail estimate, the site's formula: gold = w*gp; ajrat = gold*aj; profit = (gold+ajrat)*pf; tax = (ajrat+profit)*10%
export function estimate(p: Product, gp: number) {
  if (!p.ajrat || !gp) return 0;
  const gold = p.weight * gp, aj = gold * p.ajrat / 100, pf = (gold + aj) * PROFIT / 100;
  return gold + aj + pf + (aj + pf) * 0.1;
}

export const PRODUCTS: Product[] = [];
