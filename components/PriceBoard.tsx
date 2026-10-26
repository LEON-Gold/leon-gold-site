"use client";
// Today's Tehran gold union board and a price estimate for one piece, from the same price.json the ledger app reads
// (copied from estjt.ir every two minutes by the leon-gold-app «gold price» Action).
import { useEffect, useMemo, useState } from "react";

type Row = { name: string; value: number; unit: "rial" | "usd" };
type Feed = { gp: number; mazaneh?: number | null; day?: string; time?: string; fetched?: string; board?: Row[] };

const FEEDS = [
  "https://raw.githubusercontent.com/LEON-Gold/leon-gold-app/price/price.json",
  "https://cdn.jsdelivr.net/gh/LEON-Gold/leon-gold-app@price/price.json",
];
// the retail invoice's own formula: gold + ajrat on gold + profit on both; tax on ajrat and profit
const PROFIT = 0.07; // SAMPLE: the shop's usual seller profit
const TAX = 0.1; // SAMPLE: tax on ajrat and profit

const fa = (n: number, d = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const toman = (rial: number) => fa(Math.round(rial / 10));
const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const parse = (s: string) => {
  const n = parseFloat(s.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٫,]/g, ".").replace(/[^\d.]/g, ""));
  return isFinite(n) ? n : 0;
};

async function load(): Promise<Feed | null> {
  for (const u of FEEDS) {
    try {
      const r = await fetch(u + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as Feed;
        if (j && j.gp > 0) return j;
      }
    } catch {}
  }
  return null;
}

export default function PriceBoard() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [failed, setFailed] = useState(false);
  const [w, setW] = useState("۵");
  const [aj, setAj] = useState("۱۰");

  useEffect(() => {
    let alive = true;
    const tick = () => load().then((f) => { if (!alive) return; if (f) { setFeed(f); setFailed(false); } else setFailed(true); });
    tick();
    const id = setInterval(tick, 120000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const rows: Row[] = useMemo(() => {
    if (!feed) return [];
    if (feed.board && feed.board.length) return feed.board;
    const r: Row[] = [{ name: "طلا ۱۸ عیار", value: feed.gp, unit: "rial" }];
    if (feed.mazaneh) r.push({ name: "مظنه تهران", value: feed.mazaneh, unit: "rial" });
    return r;
  }, [feed]);

  const est = useMemo(() => {
    const gp = feed?.gp || 0, weight = parse(w), a = parse(aj) / 100;
    const gold = weight * gp, ajr = gold * a, prof = (gold + ajr) * PROFIT, tax = (ajr + prof) * TAX;
    return { gold, ajr, prof, tax, total: gold + ajr + prof + tax, ok: gp > 0 && weight > 0 };
  }, [feed, w, aj]);

  return (
    <div className="board">
      <div className="board-list" aria-live="polite">
        {rows.length ? (
          rows.map((r) => (
            <div className="board-row" key={r.name}>
              <span>{r.name}</span>
              <span className="num">{r.unit === "usd" ? "$" + fa(r.value) : toman(r.value)}</span>
            </div>
          ))
        ) : (
          <p className="board-wait">{failed ? "قیمت اتحادیه الان در دسترس نیست؛ چند دقیقه‌ی دیگر دوباره نگاه کن." : "در حال گرفتن قیمت اتحادیه…"}</p>
        )}
        {feed && <p className="board-when">به تومان، به جز انس که به دلار است. اتحادیه‌ی طلا و جواهر تهران، {feed.day} ساعت {faDigits(feed.time || "")}</p>}
      </div>

      <form className="calc" onSubmit={(e) => e.preventDefault()} aria-labelledby="calc-title">
        <h3 id="calc-title">قیمت یک کار را حساب کن</h3>
        <div className="calc-in">
          <label>
            <span>وزن (گرم)</span>
            <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} />
          </label>
          <label>
            <span>اجرت (درصد)</span>
            <input inputMode="decimal" value={aj} onChange={(e) => setAj(e.target.value)} />
          </label>
        </div>
        <output className="calc-total num" aria-live="polite">
          {est.ok ? <>{toman(est.total)}<small> تومان</small></> : "—"}
        </output>
        <dl className="calc-parts num">
          <div><dt>طلا</dt><dd>{est.ok ? toman(est.gold) : "—"}</dd></div>
          <div><dt>اجرت</dt><dd>{est.ok ? toman(est.ajr) : "—"}</dd></div>
          <div><dt>سود ۷٪</dt><dd>{est.ok ? toman(est.prof) : "—"}</dd></div>
          <div><dt>مالیات ۱۰٪ بر اجرت و سود</dt><dd>{est.ok ? toman(est.tax) : "—"}</dd></div>
        </dl>
        <p className="calc-note">با نرخ همین ساعتِ طلای ۱۸ عیار. قیمت نهایی را موقع خرید روی فاکتور می‌نویسیم.</p>
      </form>
    </div>
  );
}
