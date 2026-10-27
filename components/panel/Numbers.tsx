"use client";
// «اعداد»: the ledger's figures for a Persian day / week / month / year and their trend. Read-only.
// Rial and grams stay in separate tiles and separate charts (one unit per chart, never two axes); grams are never priced.
// Colours: green #2b7a4b (sales, in, profit) and amber #c07a22 (purchases, out, loss), validated with the dataviz skill on the ivory card.
import { useState } from "react";
import "./numbers.css";
import { fa, toman, type Store } from "@/lib/crm";
import { figures, period, series, type Figures, type Kind } from "@/lib/numbers";

const KINDS: [Kind, string, string, number][] = [["d", "روز", "دیروز", 14], ["w", "هفته", "هفته‌ی قبل", 8], ["m", "ماه", "ماه قبل", 12], ["y", "سال", "سال قبل", 5]];
const IN = "#2b7a4b", OUT = "#c07a22";
const g3 = (v: number) => fa(v, Math.abs(v) < 10 ? 3 : 2);
const tm = (rial: number) => (Math.abs(rial) < 10 ? "۰" : toman(Math.abs(rial)));

export default function Numbers({ st }: { st: Store }) {
  const [k, setK] = useState<Kind>("m");
  const [off, setOff] = useState(0);
  const [, word, prevWord, n] = KINDS.find((x) => x[0] === k)!;
  const P = period(k, off);
  const F = figures(st, P.s, P.e);
  // a period still running is compared with the same number of days at the start of the one before
  const Q = period(k, off - 1), sofar = off === 0 && k !== "d" ? Math.min(Q.e, Q.s + (period("d", 0).s - P.s)) : Q.e, prev = figures(st, Q.s, sofar);
  const prevWordNow = sofar < Q.e ? "همین مدت از " + prevWord : prevWord;
  const rows = series(st, k, n, off);
  const pick = (i: number) => setOff(off - (n - 1 - i));
  const empty = !F.inv && !F.cashIn && !F.cashOut && !F.goldIn && !F.goldOut;

  return (
    <div className="pn-page nb">
      <div className="pn-head">
        <h1>اعداد</h1>
        <p>همه از «دفتر لئون»، فقط خواندنی. گرم و ریال جدا می‌مانند؛ هیچ گرمی به قیمت امروز ریالی نشده.</p>
      </div>

      <div className="nb-filter">
        <div className="pn-chips" role="tablist" aria-label="بازه">
          {KINDS.map(([key, t]) => <button key={key} role="tab" aria-selected={k === key} onClick={() => { setK(key); setOff(0); }}>{t}</button>)}
        </div>
        <div className="nb-nav">
          <button onClick={() => setOff(off - 1)} aria-label={word + " قبل"}>→</button>
          <b>{P.label}</b>
          <button onClick={() => setOff(off + 1)} disabled={off >= 0} aria-label={word + " بعد"}>←</button>
        </div>
      </div>

      {empty && <p className="pn-card nb-none">در این {word} سندی در دفتر ثبت نشده.</p>}

      <div className="nb-groups">
        <div className="pn-card nb-group lead">
          <h2><i>◆</i>خرده‌فروشی <small>ریال، از مبلغ فاکتورها</small></h2>
          <div className="nb-hero">
            <span>فروش</span>
            <b>{tm(F.saleR)} <small>تومان</small></b>
            <em>{change(F.saleR, prev.saleR, prevWordNow)}</em>
          </div>
          <dl className="nb-tiles">
            <Tile k="سود (درصد سود فاکتورها)" v={tm(F.profR)} u="تومان" />
            <Tile k="فاکتور خرده" v={fa(F.retailN)} />
          </dl>
        </div>

        <div className="pn-card nb-group">
          <h2><i>◆</i>عمده <small>گرم عیار ۷۵۰</small></h2>
          <dl className="nb-tiles four">
            <Tile k="فروش" v={g3(F.sale)} u="گرم" sub={change(F.sale, prev.sale, prevWordNow)} />
            <Tile k="مرجوعی مشتری" v={g3(F.ret)} u="گرم" />
            <Tile k="فروش خالص" v={g3(F.net)} u="گرم" />
            <Tile k="خرید از تأمین‌کننده" v={g3(F.buy)} u="گرم" sub={F.retSup > 0.0005 ? "مرجوعی به تأمین‌کننده " + g3(F.retSup) : ""} />
            <Tile k={F.profit >= 0 ? "سود اجرت" : "ضرر اجرت"} v={g3(Math.abs(F.profit))} u="گرم" sub="اجرت فروش منهای اجرت خرید" />
            <Tile k="اجرت دریافتی" v={g3(F.wage)} u="گرم" />
          </dl>
          {F.noCost > 0 && <p className="nb-note">{fa(F.noCost)} قلم فروش «اجرت خرید» ندارد و در سود حساب نشده؛ در کارت کالای دفتر بنویسش.</p>}
        </div>

        <div className="pn-card nb-group">
          <h2><i>◆</i>دریافت و پرداخت <small>اسناد تسویه و نقدیِ فاکتورهای عمده</small></h2>
          <dl className="nb-tiles quad">
            <Tile k="پول دریافتی" v={tm(F.cashIn)} u="تومان" dot={IN} />
            <Tile k="پول پرداختی" v={tm(F.cashOut)} u="تومان" dot={OUT} />
            <Tile k="طلای دریافتی" v={g3(F.goldIn)} u="گرم ۷۵۰" dot={IN} />
            <Tile k="طلای پرداختی" v={g3(F.goldOut)} u="گرم ۷۵۰" dot={OUT} />
          </dl>
        </div>
      </div>

      <h2 className="nb-title">روند {fa(n)} {word} اخیر</h2>
      <div className="nb-charts">
        <Chart title="فروش خرده" unit="تومان" rows={rows} pick={pick} fmt={tm} series={[{ name: "فروش", color: IN, get: (f) => f.saleR }]} />
        <Chart title="طلای عمده" unit="گرم ۷۵۰" rows={rows} pick={pick} fmt={g3}
          series={[{ name: "فروش", color: IN, get: (f) => f.sale }, { name: "خرید", color: OUT, get: (f) => f.buy }]} />
        <Chart title="سود و ضرر اجرت عمده" unit="گرم ۷۵۰" rows={rows} pick={pick} fmt={(v) => (v < 0 ? "ضرر " : "") + g3(Math.abs(v))} signed
          series={[{ name: "سود", color: IN, neg: OUT, get: (f) => f.profit }]} />
        <Chart title="پول دریافتی و پرداختی" unit="تومان" rows={rows} pick={pick} fmt={tm}
          series={[{ name: "دریافت", color: IN, get: (f) => f.cashIn }, { name: "پرداخت", color: OUT, get: (f) => f.cashOut }]} />
        <Chart title="طلای دریافتی و پرداختی" unit="گرم ۷۵۰" rows={rows} pick={pick} fmt={g3}
          series={[{ name: "دریافت", color: IN, get: (f) => f.goldIn }, { name: "پرداخت", color: OUT, get: (f) => f.goldOut }]} />
      </div>

      <p className="nb-foot">
        هزینه‌های مغازه (اجاره، حقوق، قبض‌ها) در «دفتر لئون» ثبت نمی‌شود، پس این‌جا هم نیامده و سود بالا سود خالص بعد از هزینه نیست.
        فروش خرده از مبلغ فاکتورهای خرده است و فروش عمده از وزن ۷۵۰ اقلام؛ این دو با هم جمع نمی‌شوند.
      </p>
    </div>
  );
}

function change(a: number, b: number, word: string) {
  if (!(Math.abs(b) > 0.0005)) return "";
  const d = ((a - b) / Math.abs(b)) * 100;
  if (Math.abs(d) < 0.5) return "مثل " + word;
  return (d > 0 ? "▲ " : "▼ ") + fa(Math.abs(d), 0) + "٪ " + (d > 0 ? "بیشتر از " : "کمتر از ") + word;
}

function Tile({ k, v, u, sub, dot }: { k: string; v: string; u?: string; sub?: string; dot?: string }) {
  return (
    <div className="nb-tile">
      <dt>{dot && <i style={{ background: dot }} />}{k}</dt>
      <dd>{v}{u && <small> {u}</small>}</dd>
      {sub && <p>{sub}</p>}
    </div>
  );
}

type S = { name: string; color: string; neg?: string; get: (f: Figures) => number };
type Row = { p: { label: string; short: string }; f: Figures };

// columns, oldest on the left and the chosen period on the right (as in the ledger's own report); each column is a button
function Chart({ title, unit, rows, series, fmt, signed, pick }: { title: string; unit: string; rows: Row[]; series: S[]; fmt: (v: number) => string; signed?: boolean; pick: (i: number) => void }) {
  const [table, setTable] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const vals = rows.flatMap((r) => series.map((s) => s.get(r.f)));
  const mn = signed ? Math.min(0, ...vals) : 0;
  let mx = Math.max(0, ...vals);
  if (mx - mn < 1e-9) mx = mn + 1;
  const span = mx - mn, zero = (mx / span) * 100; // % from the top
  const last = rows.length - 1, any = vals.some((v) => Math.abs(v) > 0.0005);
  const tip = hot ?? last;

  return (
    <figure className="pn-card nb-chart">
      <figcaption>
        <h3>{title} <small>{unit}</small></h3>
        <button className="pn-link" onClick={() => setTable(!table)} aria-pressed={table}>{table ? "نمودار" : "جدول"}</button>
      </figcaption>
      {series.length > 1 && (
        <ul className="nb-legend">{series.map((s) => <li key={s.name}><i style={{ background: s.color }} />{s.name}</li>)}</ul>
      )}
      {table ? (
        <table className="nb-table">
          <thead><tr><th>بازه</th>{series.map((s) => <th key={s.name}>{s.name}</th>)}</tr></thead>
          <tbody>{[...rows].reverse().map((r) => <tr key={r.p.label}><td>{r.p.label}</td>{series.map((s) => <td key={s.name}>{fmt(s.get(r.f))}</td>)}</tr>)}</tbody>
        </table>
      ) : !any ? <p className="pn-empty">در این بازه‌ها چیزی ثبت نشده.</p> : (
        <>
          <p className="nb-read" aria-live="polite">
            <b>{rows[tip].p.label}</b>
            {series.map((s) => <span key={s.name}><i style={{ background: s.neg && s.get(rows[tip].f) < 0 ? s.neg : s.color }} />{series.length > 1 ? s.name + " " : ""}{fmt(s.get(rows[tip].f))}</span>)}
          </p>
          <div className="nb-plot" dir="ltr">
            <span className="nb-grid" style={{ top: 0 }}><em>{fmt(mx)}</em></span>
            {signed && mn < 0 && <span className="nb-grid" style={{ top: "100%" }}><em>{fmt(mn)}</em></span>}
            <span className="nb-base" style={{ top: zero + "%" }} />
            {rows.map((r, i) => (
              <button key={r.p.label} className={"nb-col" + (i === last ? " on" : "") + (hot === i ? " hot" : "")}
                onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} onClick={() => pick(i)}
                aria-label={r.p.label + ": " + series.map((s) => s.name + " " + fmt(s.get(r.f))).join("، ")}>
                <span className="nb-slots">
                  {series.map((s) => {
                    const v = s.get(r.f), h = (Math.abs(v) / span) * 100;
                    return (
                      <span key={s.name} className="nb-slot">
                        {Math.abs(v) >= 0.0005 && <span className={"nb-bar" + (v < 0 ? " neg" : "")}
                          style={{ height: `max(2px, ${h}%)`, background: v < 0 && s.neg ? s.neg : s.color, ...(v < 0 ? { top: zero + "%" } : { bottom: 100 - zero + "%" }) }} />}
                      </span>
                    );
                  })}
                </span>
                <small>{r.p.short}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </figure>
  );
}
