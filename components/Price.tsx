"use client";
// The live parts that read the union feed: the ticker under the hero, the two price plaques, the board and the calculator.
import { useEffect, useMemo, useRef, useState } from "react";
import { MITHQAL, fa, faDigits, parseNum, toman, usePrice, type Row } from "@/lib/price";

// a number that rolls to its new value instead of jumping
function Roll({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const a = from.current, b = value;
    if (a === b || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(b); from.current = b; return; }
    const t0 = performance.now(), dur = 1400;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      setShown(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

const stamp = (day?: string, time?: string) => (day ? `${day}، ساعت ${faDigits(time || "")}` : "");

export function Ticker() {
  const { feed } = usePrice();
  const rows: Row[] = feed?.board?.length ? feed.board : feed ? [{ name: "طلا ۱۸ عیار", value: feed.gp, unit: "rial" }] : [];
  const items = rows.length
    ? [...rows, { name: "مثقال ۱۸ عیار", value: Math.round(feed!.gp * MITHQAL), unit: "rial" as const }]
    : [{ name: "قیمت اتحادیه", value: 0, unit: "rial" as const }];
  const line = (k: string) => (
    <div className="tick-run" aria-hidden={k === "b"} key={k}>
      {items.map((r) => (
        <span className="tick-item" key={k + r.name}>
          <b>{r.name}</b>
          <span className="num">{r.value ? (r.unit === "usd" ? "$" + fa(r.value) : toman(r.value) + " تومان") : "در حال به‌روزرسانی…"}</span>
          <i aria-hidden>◆</i>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker" role="marquee" aria-label="قیمت لحظه‌ای اتحادیه‌ی طلا">
      <div className="tick-track">{line("a")}{line("b")}</div>
    </div>
  );
}

export function PricePanel() {
  const { feed, failed } = usePrice();
  const [w, setW] = useState("۵");
  const [aj, setAj] = useState("۱۲");
  const [pf, setPf] = useState("۷");
  const gp = feed?.gp || 0;
  const board: Row[] = useMemo(() => (feed?.board?.length ? feed.board.filter((r) => r.name !== "طلا ۱۸ عیار") : []), [feed]);
  const est = useMemo(() => {
    const weight = parseNum(w), a = parseNum(aj) / 100, p = parseNum(pf) / 100;
    const gold = weight * gp, ajr = gold * a, prof = (gold + ajr) * p, tax = (ajr + prof) * 0.1;
    return { gold, ajr, prof, tax, total: gold + ajr + prof + tax, ok: gp > 0 && weight > 0 };
  }, [gp, w, aj, pf]);

  return (
    <div className="pp">
      <div className="pp-plaques">
        <div className="plaque">
          <small>هر گرم طلای ۱۸ عیار</small>
          <b className="num">{gp ? <Roll value={gp / 10} format={(n) => fa(Math.round(n))} /> : "—"}</b>
          <span>تومان · {gp ? fa(gp) + " ریال" : "در انتظار اتحادیه"}</span>
        </div>
        <div className="plaque">
          <small>مثقال طلای ۱۸ عیار</small>
          <b className="num">{gp ? <Roll value={(gp * MITHQAL) / 10} format={(n) => fa(Math.round(n))} /> : "—"}</b>
          <span>تومان · هر مثقال {fa(MITHQAL, 4)} گرم</span>
        </div>
      </div>

      <div className="paper pp-board">
        <div className="pp-board-head">
          <h3>تابلوی اتحادیه</h3>
          <span className="live"><i />{feed ? stamp(feed.day, feed.time) : failed ? "در دسترس نیست" : "در حال گرفتن…"}</span>
        </div>
        <div className="pp-rows">
          {board.length ? board.map((r) => (
            <div className="pp-row" key={r.name}>
              <span>{r.name}</span>
              <span className="num">{r.unit === "usd" ? "$" + fa(r.value) : <Roll value={r.value / 10} format={(n) => fa(Math.round(n))} />}</span>
            </div>
          )) : <p className="pp-wait">{failed ? "قیمت اتحادیه الان در دسترس نیست؛ چند دقیقه‌ی دیگر دوباره نگاه کن." : "در حال گرفتن قیمت سکه و طلا…"}</p>}
        </div>
        <p className="pp-note">به تومان، به جز انس که به دلار است. منبع: تابلوی اتحادیه‌ی طلا و جواهر تهران، هر دو دقیقه تازه می‌شود.</p>
      </div>

      <PriceChart />

      <form className="calc" onSubmit={(e) => e.preventDefault()} aria-labelledby="calc-h">
        <div className="calc-head">
          <h3 id="calc-h" className="leaf">قیمت یک کار را حساب کن</h3>
          <p>همان حسابی که روی فاکتور لئون گلد می‌آید.</p>
        </div>
        <div className="calc-in">
          <label><span>وزن (گرم)</span><input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} /></label>
          <label><span>اجرت (درصد)</span><input inputMode="decimal" value={aj} onChange={(e) => setAj(e.target.value)} /></label>
          <label><span>سود (درصد)</span><input inputMode="decimal" value={pf} onChange={(e) => setPf(e.target.value)} /></label>
        </div>
        <div className="calc-out">
          <small>قیمت تقریبی</small>
          <output className="num leaf" aria-live="polite">{est.ok ? <Roll value={est.total / 10} format={(n) => fa(Math.round(n))} /> : "—"}</output>
          <span>تومان</span>
        </div>
        <dl className="calc-parts num">
          <div><dt>طلا</dt><dd>{est.ok ? toman(est.gold) : "—"}</dd></div>
          <div><dt>اجرت</dt><dd>{est.ok ? toman(est.ajr) : "—"}</dd></div>
          <div><dt>سود</dt><dd>{est.ok ? toman(est.prof) : "—"}</dd></div>
          <div><dt>مالیات بر اجرت و سود (۱۰٪)</dt><dd>{est.ok ? toman(est.tax) : "—"}</dd></div>
        </dl>
      </form>
    </div>
  );
}

// Thirty trading days of the 18k gram's closing price from tgju (CORS-open), drawn as one gold line.
type Day = { close: number; jdate: string };
export function PriceChart() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.tgju.org/v1/market/indicator/summary-table-data/geram18?length=30&start=0", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { data: string[][] }) => {
        const d = j.data.map((x) => ({ close: Number(String(x[3]).replace(/\D/g, "")), jdate: x[7] })).filter((x) => x.close > 1e6).reverse();
        if (d.length > 5) setDays(d);
      })
      .catch(() => {});
  }, []);
  if (!days) return null;

  const W = 1000, H = 260, pad = 8;
  const vals = days.map((d) => d.close), lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
  const x = (i: number) => pad + (i / (days.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + (1 - (v - lo) / span) * (H - pad * 2);
  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.close).toFixed(1)}`).join(" ");
  const first = vals[0], last = vals[vals.length - 1], ch = ((last - first) / first) * 100;
  const h = hover ?? days.length - 1;
  const md = (j: string) => faDigits(j.slice(5).replace("/", "/"));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.round(((e.clientX - r.left) / r.width) * (days.length - 1));
    setHover(Math.max(0, Math.min(days.length - 1, k)));
  };

  return (
    <div className="chart paper">
      <div className="chart-head">
        <div>
          <h3>گرم ۱۸ عیار، {fa(days.length)} روز کاری اخیر</h3>
          <p>قیمت پایانی هر روز، به تومان. منبع: tgju</p>
        </div>
        <div className="chart-now">
          <b className="num">{toman(days[h].close)}</b>
          <span>{faDigits(days[h].jdate)}</span>
          <em className={ch >= 0 ? "up" : "down"}>{ch >= 0 ? "▲" : "▼"} {fa(Math.abs(ch), 1)}٪ در این بازه</em>
        </div>
      </div>
      <div className="chart-plot">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="chart-svg" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`نمودار قیمت گرم طلای ۱۸ عیار در ${fa(days.length)} روز اخیر`}>
        <defs>
          <linearGradient id="chg" x1="0" x2="1"><stop offset="0" stopColor="#9c7433" /><stop offset=".5" stopColor="#d8b46a" /><stop offset="1" stopColor="#8a6420" /></linearGradient>
          <linearGradient id="chf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c59a50" stopOpacity=".22" /><stop offset="1" stopColor="#c59a50" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => <line key={t} x1="0" x2={W} y1={pad + t * (H - pad * 2)} y2={pad + t * (H - pad * 2)} className="chart-grid" />)}
        <path d={`${line} L${x(days.length - 1)} ${H} L${x(0)} ${H}Z`} fill="url(#chf)" />
        <path d={line} fill="none" stroke="url(#chg)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" className="chart-line" pathLength={1} />
        <line x1={x(h)} x2={x(h)} y1="0" y2={H} className="chart-cursor" />
      </svg>
      <div className="chart-dot" style={{ left: `${(x(h) / W) * 100}%`, top: `${(y(days[h].close) / H) * 100}%` }} />
      </div>
      <div className="chart-axis num">
        <span>{md(days[0].jdate)}</span><span>{md(days[Math.floor(days.length / 2)].jdate)}</span><span>{md(days[days.length - 1].jdate)}</span>
      </div>
      <div className="chart-range num"><span>بیشترین {toman(hi)}</span><span>کمترین {toman(lo)}</span></div>
    </div>
  );
}
