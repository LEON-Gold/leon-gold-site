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
