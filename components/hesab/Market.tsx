"use client";
// «تحلیل بازار» in «حساب من» (owner, 2026-11-10): only for a VIP party the owner allows in the ledger (account.market).
// The same reading as the ledger's page: gold and the free-market dollar live (the price feed, refreshed every 2 minutes),
// a year of daily history from tgju (CORS-open), two charts (two prices, two charts) and the day's analysis.
import { useEffect, useMemo, useState } from "react";
import { faDigits } from "@/lib/hesab";

type Row = { d: string; j: string; c: number };
type Live = { gp: number; time: string; usd: number; usdWhen: string; ounce: number };
type Hist = { g: Row[]; d: Row[]; o: Row[] };
const OZ = 31.1034768, KEY = "hs-mk";
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
type J = { d: string; g: number; usd: number; oz: number; prem: number };
function join(H: Hist): J[] {
  const by = (L: Row[]) => Object.fromEntries(L.map(r => [r.d, r.c])), D = by(H.d), O = by(H.o);
  return H.g.filter(r => D[r.d] && O[r.d]).map(r => ({ d: r.d, g: r.c, usd: D[r.d], oz: O[r.d], prem: r.c / (O[r.d] * D[r.d] / OZ * .75) - 1 }));
}
function reading(G: Stats | null, D: Stats | null, Jn: J[], H: Hist, L: Live | null): string[] {
  const out: string[] = [];
  if (G) {
    out.push(`<b>طلا ${TR[G.trend]} است:</b> قیمت ${G.last >= G.ma30 ? "بالای" : "زیر"} میانگین ۳۰ روزه (${tm(G.ma30)} تومان). در ۳۰ روز ${pct(G.d30)}، در ۷ روز ${pct(G.d7)}.`);
    out.push(`جای قیمت در دامنه‌ی ۳۰ روز: ${fa(G.pos * 100)}٪ (کف ${tm(G.lo)}، سقف ${tm(G.hi)} تومان). نوسان معمول روزانه حدود ${fa(G.swing * 100, 1)}٪.`);
    out.push(G.rsi >= 70 ? `<b>RSI ${fa(G.rsi)}</b>: طلا در کوتاه‌مدت داغ شده؛ معمولاً بعد از چنین رشدی مکث یا اصلاح کوچک دیده می‌شود.` : G.rsi <= 30 ? `<b>RSI ${fa(G.rsi)}</b>: طلا در کوتاه‌مدت زیاد افت کرده؛ معمولاً بعدش برگشت کوچکی دیده می‌شود.` : `شاخص قدرت نسبی (RSI) ${fa(G.rsi)}: نه داغ است نه سرد.`);
  }
  if (D) out.push(`<b>دلار ${TR[D.trend]} است:</b> ${tm(D.last)} تومان؛ ۷ روز ${pct(D.d7)}، ۳۰ روز ${pct(D.d30)}.`);
  if (Jn.length > 31) {
    const from = H.g[Math.max(0, H.g.length - 31)].d, a = Jn.find(x => x.d >= from), b = Jn[Jn.length - 1];
    if (a && a !== b) {
      const s = { g: Math.log(b.g / a.g), d: Math.log(b.usd / a.usd), o: Math.log(b.oz / a.oz), p: Math.log((1 + b.prem) / (1 + a.prem)) };
      const lead = ([["دلار", s.d], ["انس جهانی", s.o], ["حباب بازار", s.p]] as [string, number][]).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))[0];
      out.push(`<b>از ${pct(Math.exp(s.g) - 1)} تغییر طلا در ۳۰ روز:</b> دلار ${pct(Math.exp(s.d) - 1)}، انس جهانی ${pct(Math.exp(s.o) - 1)}، حباب بازار ${pct(Math.exp(s.p) - 1)}. بیشترین سهم با <b>${lead[0]}</b> بوده.`);
    }
    const pr = Jn.map(x => x.prem), p90 = mean(pr.slice(-90)), pn = pr[pr.length - 1];
    out.push(`<b>حباب طلا</b> (فاصله‌ی قیمت تهران با ارزش انس جهانی به دلار آزاد): ${fa(pn * 100, 1)}٪؛ میانگین سه ماه ${fa(p90 * 100, 1)}٪. ${pn > p90 + .01 ? "الان <b>بالاتر از معمول</b> است." : pn < p90 - .01 ? "الان <b>پایین‌تر از معمول</b> است؛ طلای تهران نسبت به دلار و انس ارزان‌تر از همیشه است." : "نزدیک همیشه است."}`);
  }
  if (L?.gp && L.usd && L.ounce) { const fair = L.ounce * L.usd / OZ * .75; out.push(`با انس ${fa(L.ounce)} دلار و دلار ${tm(L.usd)} تومان، ارزش هر گرم ۱۸ عیار ${tm(fair)} تومان است و بازار الان ${tm(L.gp)} تومان.`); }
  return out;
}

function Chart({ rows, all, kind, title }: { rows: Row[]; all: Row[]; kind: "gold" | "usd"; title: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const n = rows.length, off = all.length - n;
  const ma = useMemo(() => rows.map((_, i) => mean(all.slice(Math.max(0, off + i - 29), off + i + 1).map(x => x.c))), [rows, all, off]);
  if (n < 2) return null;
  const vals = rows.map(r => r.c).concat(ma); let lo = Math.min(...vals), top = Math.max(...vals); const pad = (top - lo) * .08 || top * .01; lo -= pad; top += pad;
  const W = 360, H = 210, L = 4, R = 4, T = 8, B = 22, x = (i: number) => L + (W - L - R) * i / (n - 1), y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (top - lo));
  const path = (a: number[]) => a.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("");
  const pick = (e: React.PointerEvent<SVGSVGElement>) => { const b = e.currentTarget.getBoundingClientRect(); setHi(Math.max(0, Math.min(n - 1, Math.round((e.clientX - b.left - b.width * L / W) / (b.width * (W - L - R) / W) * (n - 1))))); };
  const r = hi != null ? rows[hi] : rows[n - 1];
  return (
    <figure className={"mk-chart mk-" + kind}>
      <figcaption><b>{title}</b><span className="mk-lg"><i className="mk-sw" />قیمت <i className="mk-sw mk-ma" />میانگین ۳۰ روزه</span></figcaption>
      <p className="mk-read" aria-live="polite"><b>{faDigits(r.j)}</b> · {tm(r.c)} تومان <span>(میانگین ۳۰ روزه {tm(ma[hi ?? n - 1])})</span></p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setHi(null)}>
        {[0, 1, 2, 3].map(k => { const v = lo + (top - lo) * (k + .5) / 4; return <g key={k}><line className="mk-gl" x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text className="mk-t" x={L} y={y(v) - 4}>{tm(v)}</text></g>; })}
        <line className="mk-base" x1={L} x2={W - R} y1={H - B} y2={H - B} />
        <path className="mk-mal" d={path(ma)} /><path className="mk-l" d={path(rows.map(r => r.c))} />
        <circle className="mk-end" cx={x(n - 1)} cy={y(rows[n - 1].c)} r={4} />
        {hi != null && <line className="mk-cur" x1={x(hi)} x2={x(hi)} y1={T} y2={H - B} />}
        {[0, Math.round((n - 1) / 3), Math.round(2 * (n - 1) / 3), n - 1].map((i, k) => <text key={k} className="mk-t" x={x(i)} y={H - 6} textAnchor={k === 0 ? "start" : k === 3 ? "end" : "middle"}>{faDigits(rows[i].j.slice(5))}</text>)}
      </svg>
    </figure>
  );
}

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

export default function Market() {
  const { live: L, hist: H } = useMarket();
  const [range, setRange] = useState(30);
  const G = H ? stats(H.g) : null, D = H ? stats(H.d) : null, Jn = useMemo(() => H ? join(H) : [], [H]);
  const lines = H ? reading(G, D, Jn, H, L) : [];
  return (
    <section className="hs-sec hs-mk" aria-labelledby="hs-mk">
      <h1 className="hs-h" id="hs-mk">تحلیل بازار</h1>
      <div className="hs-mk-now">
        <div className="paper"><small>هر گرم طلای ۱۸ عیار</small><b className="num">{L?.gp ? tm(L.gp) : G ? tm(G.last) : "…"}</b><span>تومان{L?.time ? ` · اتحادیه، ساعت ${faDigits(L.time)}` : ""}</span></div>
        <div className="paper"><small>دلار آزاد تهران</small><b className="num">{L?.usd ? tm(L.usd) : D ? tm(D.last) : "…"}</b><span>تومان{D ? ` · ۷ روز ${pct(D.d7)}` : ""}</span></div>
        {L?.ounce ? <div className="paper"><small>انس جهانی طلا</small><b className="num">{fa(L.ounce)}</b><span>دلار</span></div> : null}
      </div>
      <p className="hs-prof-fine">هر ۲ دقیقه خودش به‌روز می‌شود.</p>
      {lines.length ? <div className="hs-mk-an paper"><h2>تحلیل امروز</h2><ul>{lines.map((t, i) => <li key={i} dangerouslySetInnerHTML={{ __html: t }} />)}</ul>
        <p className="hs-prof-fine">این تحلیل از روی اعداد گذشته حساب شده و پیش‌بینی قطعی نیست.</p></div>
        : <p className="hs-wait">{H ? "" : "در حال آوردن تاریخچه‌ی قیمت…"}</p>}
      <div className="hs-chips" role="group" aria-label="بازه">{[[30, "۱ ماه"], [90, "۳ ماه"], [180, "۶ ماه"], [365, "۱ سال"]].map(([v, t]) => <button key={v} type="button" className={range === v ? "on" : ""} aria-pressed={range === v} onClick={() => setRange(v as number)}>{t}</button>)}</div>
      {H && <div className="hs-mk-charts">
        <div className="paper"><Chart rows={H.g.slice(-range)} all={H.g} kind="gold" title="طلای ۱۸ عیار (تومان، هر گرم)" /></div>
        <div className="paper"><Chart rows={H.d.slice(-range)} all={H.d} kind="usd" title="دلار آزاد (تومان)" /></div>
      </div>}
    </section>
  );
}
