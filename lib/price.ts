"use client";
// One shared feed for the ticker, the plaques, the board and the calculator: the union board copied by the
// leon-gold-app «gold price» Action into price.json every two minutes (two mirrors, in case one is filtered).
// Like the ledger, a copy over 40 minutes old gives way to tgju's 18k gram; the old copy is shown only when tgju fails too.
import { useSyncExternalStore } from "react";

export type Row = { name: string; value: number; unit: "rial" | "usd" };
export type Feed = { gp: number; mazaneh?: number | null; day?: string; time?: string; fetched?: string; board?: Row[]; src?: "tgju" };

const FEEDS = [
  "https://raw.githubusercontent.com/LEON-Gold/leon-gold-app/price/price.json",
  "https://cdn.jsdelivr.net/gh/LEON-Gold/leon-gold-app@price/price.json",
];
const TGJU = "https://api.tgju.org/v1/market/indicator/today-table-data/geram18?length=1&start=0";
const FRESH = 40 * 60e3;

let cache: Feed | null = null;
let failed = false;
let inflight: Promise<Feed | null> | null = null;
const subs = new Set<() => void>();

async function getJson(u: string): Promise<unknown> {
  try {
    const r = await fetch(u, { cache: "no-store", signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(8000) : undefined });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
const age = (f: Feed) => Date.now() - Date.parse(f.fetched || "");
async function fetchFeed(): Promise<Feed | null> {
  let stale: Feed | null = null;
  for (const u of FEEDS) {
    const j = (await getJson(u + "?t=" + Math.floor(Date.now() / 60000))) as Feed | null;
    if (!j || !(j.gp > 0)) continue;
    if (age(j) < FRESH) return j;
    if (!stale || !(age(j) >= age(stale))) stale = j;
  }
  const t = (await getJson(TGJU)) as { data?: string[][] } | null;
  const row = t?.data?.[0], gp = row ? Number(String(row[0]).replace(/\D/g, "")) : 0;
  if (gp > 1e6 && gp < 1e12) return { gp, day: "امروز", time: String(row![1] || "").slice(0, 5), src: "tgju" };
  return stale;
}
function refresh() {
  if (!inflight) inflight = fetchFeed().then((f) => { inflight = null; if (f) cache = f; failed = !cache; subs.forEach((s) => s()); return cache; });
  return inflight;
}
if (typeof window !== "undefined") setInterval(refresh, 120000);

const subscribe = (s: () => void) => { subs.add(s); if (!cache && !inflight) refresh(); return () => { subs.delete(s); }; };
export function usePrice() {
  const feed = useSyncExternalStore(subscribe, () => cache, () => null);
  const isFailed = useSyncExternalStore(subscribe, () => failed, () => false);
  return { feed, failed: isFailed };
}

export const MITHQAL = 4.3318;
export const fa = (n: number, d = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const toman = (rial: number) => fa(Math.round(rial / 10));
export const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
export const parseNum = (s: string) => {
  const n = parseFloat(s.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[٫,]/g, ".").replace(/[^\d.]/g, ""));
  return isFinite(n) ? n : 0;
};
