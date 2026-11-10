"use client";
// «تحلیل بازار» in «حساب من» (owner, 2026-11-10): only for a VIP party the owner allows in the ledger (account.market).
// The same reading as the ledger's page: gold and the free-market dollar live (the price feed, refreshed every 2 minutes),
// a year of daily history from tgju (CORS-open), two charts (two prices, two charts) and the day's analysis.
import { useEffect, useMemo, useRef, useState } from "react";
import ME from "@/lib/marketEngine";
import "@/lib/marketEngine.css";

type Row = { d: string; j: string; c: number };
type Live = { gp: number; time: string; usd: number; usdWhen: string; ounce: number };
type Hist = { g: Row[]; d: Row[]; o: Row[] };
const KEY = "hs-mk";
const num = (s: unknown) => +String(s ?? "").replace(/[^\d.]/g, "") || 0;
const fa = (n: number, d = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const tm = (rial: number) => fa(Math.round(rial / 10));
const pct = (v: number | null, d = 1) => v == null ? "—" : (v > 0 ? "▲ " : v < 0 ? "▼ " : "") + fa(Math.abs(v * 100), d) + "٪";
const mean = (a: number[]) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const get = async (u: string, ms = 9000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(u, { cache: "no-store", signal: c.signal }); if (!r.ok) throw 0; return await r.json(); } finally { clearTimeout(t); } };

async function loadLive(): Promise<Live | null> {
  const m = Math.floor(Date.now() / 60000);
  let j: { gp?: number; time?: string; usd?: { p?: number; t?: string }; board?: { name: string; value: number }[] } | null = null;
  for (const u of ["https://raw.githubusercontent.com/LEON-Gold/leon-gold-app/price/price.json?t=", "https://cdn.jsdelivr.net/gh/LEON-Gold/leon-gold-app@price/price.json?t="]) {
    try { j = await get(u + m); break; } catch { /* the other mirror */ }
  }
  if (!j) return null;
  return { gp: +(j.gp || 0), time: String(j.time || ""), usd: +(j.usd?.p || 0), usdWhen: String(j.usd?.t || ""), ounce: +((j.board || []).find(b => b.name === "انس طلا")?.value || 0) };
}
async function loadHist(): Promise<Hist | null> {
  const one = async (ind: string) => {
    const x = await get(`https://api.tgju.org/v1/market/indicator/summary-table-data/${ind}?length=400&start=0`, 15000);
    return ((x?.data || []) as string[][]).map(r => ({ d: String(r[6] || ""), j: String(r[7] || ""), c: num(r[3]) })).filter(r => r.c > 0 && r.d).reverse();
  };
  try { const [g, d, o] = await Promise.all([one("geram18"), one("price_dollar_rl"), one("ons")]); return g.length ? { g, d, o } : null; } catch { return null; }
}

type Stats = { last: number; d1: number | null; d7: number | null; d30: number | null; ma7: number; ma30: number; lo: number; hi: number; pos: number; swing: number; rsi: number; trend: "up" | "down" | "flat" };
function stats(rows: Row[]): Stats | null {
  const c = rows.map(r => r.c), n = c.length; if (n < 8) return null;
  const last = c[n - 1], ago = (k: number) => n > k ? last / c[n - 1 - k] - 1 : null, w30 = c.slice(-30), ret: number[] = [];
  for (let i = Math.max(1, n - 30); i < n; i++) ret.push(c[i] / c[i - 1] - 1);
  let g = 0, l = 0; const r14 = c.slice(-15); for (let k = 1; k < r14.length; k++) { const dd = r14[k] - r14[k - 1]; if (dd > 0) g += dd; else l -= dd; }
  const ma7 = mean(c.slice(-7)), ma30 = mean(w30), lo = Math.min(...w30), hi = Math.max(...w30);
  return { last, d1: ago(1), d7: ago(7), d30: ago(30), ma7, ma30, lo, hi, pos: hi > lo ? (last - lo) / (hi - lo) : .5, swing: mean(ret.map(Math.abs)), rsi: l === 0 ? 100 : 100 - 100 / (1 + g / l),
    trend: last > ma30 && ma7 > ma30 ? "up" : last < ma30 && ma7 < ma30 ? "down" : "flat" };
}
const TR = { up: "صعودی", down: "نزولی", flat: "بی‌جهت (نوسانی)" };
export function useMarket() {
  const [live, setLive] = useState<Live | null>(null);
  const [hist, setHist] = useState<Hist | null>(() => { try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); return c?.hist || null; } catch { return null; } });
  useEffect(() => {
    let dead = false;
    const tick = () => loadLive().then(l => { if (!dead && l) setLive(l); });
    tick(); const t = setInterval(() => { if (document.visibilityState === "visible") tick(); }, 120000);
    loadHist().then(h => { if (dead || !h) return; setHist(h); try { localStorage.setItem(KEY, JSON.stringify({ hist: h, at: Date.now() })); } catch { /* full */ } });
    return () => { dead = true; clearInterval(t); };
  }, []);
  return { live, hist };
}

// the small card on the home page: gold and dollar now, and the way in
export function MarketCard({ onOpen }: { onOpen: () => void }) {
  const { live, hist } = useMarket(), G = hist ? stats(hist.g) : null;
  const spark = hist ? hist.g.slice(-30).map(r => r.c) : [], lo = Math.min(...spark), top = Math.max(...spark);
  return (
    <button type="button" className="hs-sec hs-mkcard paper" onClick={onOpen}>
      <span className="hs-mkcard-h"><b>تحلیل بازار</b><small>مخصوص اعضای VIP</small></span>
      <span className="hs-mkcard-v"><span><small>طلای ۱۸ عیار</small><b className="num">{live?.gp ? tm(live.gp) : G ? tm(G.last) : "…"}</b></span><span><small>دلار آزاد</small><b className="num">{live?.usd ? tm(live.usd) : "…"}</b></span></span>
      {spark.length > 1 && <span className="hs-mkcard-sp" aria-hidden>{spark.map((v, i) => <i key={i} style={{ height: (18 + 82 * (v - lo) / ((top - lo) || 1)) + "%" }} />)}</span>}
      <span className="hs-mkcard-go">{G ? `طلا ${TR[G.trend]} · ۳۰ روز ${pct(G.d30)}` : "نمودار و تحلیل روز"} ←</span>
    </button>
  );
}

// the page: the shared engine (lib/marketEngine.js, the same as the ledger's), its tools and range kept here
export default function Market() {
  const { live, hist } = useMarket();
  const [st, setSt] = useState(() => ({ range: 90, tools: ME.TOOLS0(), anim: true }));
  const ref = useRef<HTMLDivElement>(null), prev = useRef<unknown>(null);
  const html = useMemo(() => ME.page(hist, live, st), [hist, live, st]);
  useEffect(() => { const el = ref.current; if (!el) return; ME.bind(el); const now = ME.liveOf(hist, live); ME.flashAll(el, prev.current, now); prev.current = now; }, [html, hist, live]);
  // the lines draw in once (and again on a new range); later refreshes do not redraw them
  useEffect(() => { if (!hist || !st.anim) return; const t = setTimeout(() => setSt(x => ({ ...x, anim: false })), 1600); return () => clearTimeout(t); }, [hist, st.anim]);
  const click = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement, r = t.closest<HTMLElement>("[data-me-range]"), tool = t.closest<HTMLElement>("[data-me-tool]");
    if (r) setSt(x => ({ ...x, range: +(r.dataset.meRange || 90), anim: true }));
    else if (tool) { const k = tool.closest<HTMLElement>(".me-fig")?.dataset.kind as "gold" | "usd" | "oz" | undefined; if (!k) return;
      setSt(x => { const n = new Set(x.tools[k]); const id = tool.dataset.meTool || ""; if (n.has(id)) n.delete(id); else n.add(id); return { ...x, tools: { ...x.tools, [k]: n } }; }); }
  };
  return (
    <section className="hs-sec hs-mk" aria-labelledby="hs-mk">
      <h1 className="hs-h" id="hs-mk">تحلیل بازار</h1>
      <p className="hs-prof-fine">زنده؛ هر ۲ دقیقه به‌روز می‌شود. ابزارهای هر نمودار را با دکمه‌های بالایش روشن و خاموش کنید.</p>
      <div ref={ref} onClick={click} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
