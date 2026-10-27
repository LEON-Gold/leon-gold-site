// The panel's «اعداد»: the ledger's own figures per Persian day / week / month / year, read-only.
// Follows metrics() in ../leon-gold/index.html exactly: wholesale in 750-equivalent grams, retail only from the rial
// amounts written on invoices. Grams are never turned into rial, and nothing the ledger does not record (expenses) is shown.
import { jParts, latin, type Store } from "./crm";

export type Kind = "d" | "w" | "m" | "y";
export type Period = { s: number; e: number; label: string; short: string };
export type Figures = {
  inv: number; retailN: number; saleR: number; profR: number; // retail, rial
  sale: number; ret: number; net: number; buy: number; retSup: number; wage: number; gain: number; loss: number; retM: number; profit: number; noCost: number; // wholesale, grams 750
  cashIn: number; cashOut: number; goldIn: number; goldOut: number; // money and gold that changed hands, as written on the documents
};

const DAY = 864e5;
const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const fa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
// Tehran day numbers, the same as crm.ts's dayNo
const J = (n: number) => jParts(new Date(n * DAY - 3.5 * 36e5 + 12 * 36e5));
const today = () => Math.floor((Date.now() + 3.5 * 36e5) / DAY);
const dayOf = (iso: string) => Math.floor((new Date(iso).getTime() + 3.5 * 36e5) / DAY);

// the first day of a Persian year, found once and kept
const yearStart = new Map<number, number>();
function firstOfYear(y: number) {
  let n = yearStart.get(y);
  if (n != null) return n;
  n = Math.floor(Date.UTC(y + 621, 2, 21) / DAY);
  for (let i = 0, j = J(n); i < 6 && !(j.y === y && j.m === 1 && j.d === 1); i++, j = J(n)) n += j.y < y ? 1 : -1;
  yearStart.set(y, n);
  return n;
}
const dayInYear = (m: number, d: number) => (m <= 6 ? (m - 1) * 31 : 186 + (m - 7) * 30) + d - 1;
export const jDay = (y: number, m: number, d: number) => firstOfYear(y) + dayInYear(m, d);

// «۱۴۰۵/۰۸/۰۵» as the ledger writes it, else the save time (the ledger's invDay)
export function docDay(doc: { date?: string; ts?: string }) {
  const p = latin(doc.date || "").split(/\D+/).filter(Boolean).map(Number);
  if (p.length === 3 && p[0] > 1300 && p[0] < 1500 && p[1] >= 1 && p[1] <= 12 && p[2] >= 1 && p[2] <= 31) return jDay(p[0], p[1], p[2]);
  return doc.ts ? dayOf(doc.ts) : today();
}

const WEEK = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
function periodAt(k: Kind, t: number): Period {
  const j = J(t);
  if (k === "d") return { s: t, e: t, label: `${WEEK[(t + 5) % 7]} ${fa(j.d)} ${MONTHS[j.m - 1]}`, short: fa(j.d) + "/" + fa(j.m) };
  if (k === "w") {
    const s = t - ((t + 5) % 7), a = J(s), b = J(s + 6); // Saturday to Friday
    return { s, e: s + 6, label: `${fa(a.d)} ${MONTHS[a.m - 1]} تا ${fa(b.d)} ${MONTHS[b.m - 1]}`, short: fa(a.d) + "/" + fa(a.m) };
  }
  if (k === "m") {
    const s = t - (j.d - 1), next = j.m === 12 ? firstOfYear(j.y + 1) : jDay(j.y, j.m + 1, 1);
    return { s, e: next - 1, label: `${MONTHS[j.m - 1]} ${fa(j.y)}`, short: MONTHS[j.m - 1] };
  }
  const s = firstOfYear(j.y);
  return { s, e: firstOfYear(j.y + 1) - 1, label: "سال " + fa(j.y), short: fa(j.y) };
}
// off 0 = the current period, -1 the one before, ...
export function period(k: Kind, off: number): Period {
  let p = periodAt(k, today());
  for (let i = 0; i < -off; i++) p = periodAt(k, p.s - 1);
  return p;
}

type Item = { desc?: string; weight?: number; carat?: number; ajrat?: number; ajratG?: number; w750?: number; costAj?: number; pid?: string; ret?: boolean; amount?: number; gold?: number };
type Inv = { kind?: string; doc?: string; date?: string; ts?: string; items?: Item[]; gold?: { g750?: number }[]; goldDir?: string; trade?: { cin?: number; cout?: number } | null };
type Set = { dir?: string; unit?: string; amount?: number; date?: string; ts?: string; note?: string };

const labOf = (c: number) => (c <= 24 ? (c * 1000) / 24 : c);
const pureOf = (it: Item) => (it.w750 != null ? +it.w750 : (+(it.weight || 0) * labOf(+(it.carat || 750))) / 750);

export function figures(st: Store, s: number, e: number): Figures {
  const F: Figures = { inv: 0, retailN: 0, saleR: 0, profR: 0, sale: 0, ret: 0, net: 0, buy: 0, retSup: 0, wage: 0, gain: 0, loss: 0, retM: 0, profit: 0, noCost: 0, cashIn: 0, cashOut: 0, goldIn: 0, goldOut: 0 };
  const products = st.products as Record<string, { buyAjrat?: number }>;
  // purchase wage: kept on the item when the invoice was saved, else the product card's current one
  const costOf = (it: Item) => (it.costAj != null ? +it.costAj : it.pid && products[it.pid]?.buyAjrat != null ? +products[it.pid].buyAjrat! : null);
  for (const i of Object.values(st.invoices) as Inv[]) {
    const d = docDay(i);
    if (d < s || d > e) continue;
    F.inv++;
    if (i.kind !== "whole") {
      F.retailN++;
      for (const it of i.items || []) { const a = +(it.amount || 0), g = +(it.gold || 0); F.saleR += a; F.profR += a - g - Math.round((g * +(it.ajrat || 0)) / 100); }
      continue;
    }
    const out = i.doc !== "rc";
    for (const it of i.items || []) {
      const p = pureOf(it), c = costOf(it), m = c == null ? null : (p * (+(it.ajrat || 0) - c)) / 100;
      if (out && !it.ret) { F.sale += p; F.wage += +(it.ajratG || 0); if (m == null) F.noCost++; else if (m >= 0) F.gain += m; else F.loss -= m; }
      else if (!out && it.ret) { F.ret += p; if (m != null) F.retM += m; }
      else if (!out) F.buy += p;
      else F.retSup += p;
    }
    // gold handed over on the invoice (آبشده etc.), in 750 grams, and cash written on it
    const g = (i.gold || []).reduce((a, x) => a + +(x.g750 || 0), 0);
    if (i.goldDir === "dr") F.goldOut += g; else F.goldIn += g;
    F.cashIn += +(i.trade?.cin || 0); F.cashOut += +(i.trade?.cout || 0);
  }
  for (const x of Object.values(st.settlements) as Set[]) {
    const d = docDay(x);
    if (d < s || d > e || /^تعیین عیار/.test(x.note || "")) continue; // an assay correction moves no gold
    const a = +(x.amount || 0), inn = x.dir === "in";
    if (x.unit === "g") { if (inn) F.goldIn += a; else F.goldOut += a; }
    else if (inn) F.cashIn += a; else F.cashOut += a;
  }
  F.net = F.sale - F.ret;
  F.profit = F.gain - F.loss - F.retM;
  return F;
}

export function series(st: Store, k: Kind, n: number, off: number) {
  return Array.from({ length: n }, (_, i) => { const p = period(k, off - (n - 1 - i)); return { p, f: figures(st, p.s, p.e) }; });
}
