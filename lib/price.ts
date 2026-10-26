"use client";
// One shared feed for the ticker, the plaques, the board and the calculator: the union board copied by the
// leon-gold-app «gold price» Action into price.json every two minutes (two mirrors, in case one is filtered).
import { useEffect, useState } from "react";

export type Row = { name: string; value: number; unit: "rial" | "usd" };
export type Feed = { gp: number; mazaneh?: number | null; day?: string; time?: string; fetched?: string; board?: Row[] };

const FEEDS = [
  "https://raw.githubusercontent.com/LEON-Gold/leon-gold-app/price/price.json",
  "https://cdn.jsdelivr.net/gh/LEON-Gold/leon-gold-app@price/price.json",
];

let cache: Feed | null = null;
let inflight: Promise<Feed | null> | null = null;
const subs = new Set<(f: Feed | null) => void>();

async function fetchFeed(): Promise<Feed | null> {
  for (const u of FEEDS) {
    try {
      const r = await fetch(u + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" });
      if (r.ok) { const j = (await r.json()) as Feed; if (j && j.gp > 0) return j; }
    } catch {}
  }
  return null;
}
function refresh() {
  if (!inflight) inflight = fetchFeed().then((f) => { inflight = null; if (f) cache = f; subs.forEach((s) => s(cache)); return cache; });
  return inflight;
}
if (typeof window !== "undefined") setInterval(refresh, 120000);

export function usePrice() {
  const [feed, setFeed] = useState<Feed | null>(cache);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const s = (f: Feed | null) => { setFeed(f); setFailed(!f); };
    subs.add(s);
    if (cache) setFeed(cache); else refresh();
    return () => { subs.delete(s); };
  }, []);
  return { feed, failed };
}

export const MITHQAL = 4.3318;
export const fa = (n: number, d = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const toman = (rial: number) => fa(Math.round(rial / 10));
export const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
export const parseNum = (s: string) => {
  const n = parseFloat(s.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٫,]/g, ".").replace(/[^\d.]/g, ""));
  return isFinite(n) ? n : 0;
};
