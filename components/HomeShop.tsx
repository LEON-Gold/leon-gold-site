"use client";
// The home page as a shop window (owner, 2026-11-26: a layout like a jewellery store's home, in Leon's own colours):
// a big banner of the newest pieces, a strip of categories with a photo each, rows of pieces that slide sideways
// (newest, ready to take away, lowest wage), and «by budget» tiles. Everything comes from the real showcase (pieces the
// owner marks «روی سایت» in the ledger) at this hour's union rate; nothing here is written by hand.
import { useEffect, useMemo, useRef, useState } from "react";
import { catOf, famOf, priceOf, stockOf } from "@/components/hesab/Vitrin";
import { faDigits, gram, publicMedia, publicVitrin, toman, VCATS_DEFAULT, type Showcase, type VItem } from "@/lib/hesab";
import { usePrice } from "@/lib/price";

const img = (it: VItem) => it.media.find(m => m.type === "image");
const pic = (it: VItem) => { const m = img(it); return m ? publicMedia(m.id) : ""; };
const link = (q: Record<string, string>) => "vitrin/?" + new URLSearchParams({ g: "all", ...q }).toString();
// one piece per product (its models stay inside the product's page)
const firstOfFam = (L: VItem[]) => L.filter((i, n) => L.findIndex(x => famOf(x) === famOf(i)) === n);
// budgets in million toman; a tile shows only when it has pieces
const BUDGETS: [number, number][] = [[0, 10], [10, 30], [30, 70], [70, 0]];
const budgetName = ([a, b]: [number, number]) => !a ? `تا ${faDigits(b)} میلیون` : !b ? `بیش از ${faDigits(a)} میلیون` : `${faDigits(a)} تا ${faDigits(b)} میلیون`;

function Card({ it, gp }: { it: VItem; gp: number }) {
  const u = pic(it);
  return (
    <li className="sh-card">
      <a href={link({ p: it.id })}>
        <span className="sh-card-pic">{u ? <img src={u} alt="" loading="lazy" decoding="async" /> : <img className="none" src="/leaf.webp" alt="" />}
          <em className={"sh-card-st " + stockOf(it)}>{stockOf(it) === "qty" ? "آماده‌ی تحویل" : "قابل سفارش"}</em></span>
        <b>{it.name}</b>
        <span className="sh-card-k num">{gram(it.weight)} گرم · اجرت {faDigits(it.ajrat)}٪</span>
        {gp ? <strong className="num">{toman(priceOf(it, gp).total)} <small>تومان</small></strong> : <strong className="sh-card-wait">قیمت با نرخ روز</strong>}
      </a>
    </li>
  );
}

function Row({ id, title, note, more, items, gp }: { id: string; title: string; note: string; more: string; items: VItem[]; gp: number }) {
  const ul = useRef<HTMLUListElement>(null);
  // with a mouse the row moves by the arrows (a phone just swipes); RTL: «بعدی» goes to the left
  const go = (d: number) => { const el = ul.current; if (el) el.scrollBy({ left: -d * el.clientWidth * 0.8, behavior: "smooth" }); };
  if (!items.length) return null;
  return (
    <section className="sh-row" aria-labelledby={id}>
      <div className="sh-row-h">
        <div><h2 id={id}>{title}</h2><p>{note}</p></div>
        <span className="sh-row-act">
          <button type="button" className="sh-arr" aria-label="قبلی" onClick={() => go(-1)}>→</button>
          <button type="button" className="sh-arr" aria-label="بعدی" onClick={() => go(1)}>←</button>
          <a className="sh-more" href={more}>همه <i aria-hidden>←</i></a>
        </span>
      </div>
      <ul className="sh-slide" ref={ul}>{items.map(it => <Card key={it.id} it={it} gp={gp} />)}</ul>
    </section>
  );
}

export default function HomeShop() {
  const [s, setS] = useState<Showcase | null>(null);
  const [at, setAt] = useState(0);
  const { feed } = usePrice();
  const gp = feed?.gp || 0;
  useEffect(() => { publicVitrin().then(setS, () => {}); }, []);
  const all = useMemo(() => firstOfFam((s?.items || []).filter(i => stockOf(i) !== "none")), [s]);
  const cats = s?.cats || VCATS_DEFAULT;
  // the banner: the newest piece with a photo from each of up to four categories
  const slides = useMemo(() => { const seen = new Set<string>(); return all.filter(i => { const c = catOf(i, cats); if (!img(i) || seen.has(c)) return false; seen.add(c); return true; }).slice(0, 4); }, [all, cats]);
  useEffect(() => {
    if (slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAt(a => (a + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);
  const catTiles = useMemo(() => cats.map(c => ({ name: c.name, it: all.find(i => catOf(i, cats) === c.name && img(i)), n: all.filter(i => catOf(i, cats) === c.name).length })).filter(c => c.n > 0), [all, cats]);
  const ready = all.filter(i => stockOf(i) === "qty").slice(0, 12);
  const lowWage = [...all].sort((a, b) => a.ajrat - b.ajrat).slice(0, 12);
  const budgets = gp ? BUDGETS.map(b => { const L = all.filter(i => { const m = priceOf(i, gp).total / 1e7; return m >= b[0] && (!b[1] || m < b[1]); }); return { b, n: L.length, it: L.find(img) }; }).filter(x => x.n > 0) : [];
  const cur = slides[at % (slides.length || 1)];

  return (
    <>
      <section className="sh-banner" aria-label="ویترین لئون گلد">
        <div className="sh-ban-pics" aria-hidden>
          {slides.map((it, i) => <img key={it.id} src={pic(it)} alt="" className={i === at ? "on" : ""} fetchPriority={i ? "low" : "high"} decoding="async" />)}
          {!slides.length && <img className="on sh-ban-leaf" src="/leaf-hd.webp" alt="" />}
        </div>
        <div className="sh-ban-in">
          <p className="sh-ban-k" lang="en" dir="ltr">LEON GOLD</p>
          <h1 className="leaf">لئون گلد</h1>
          <p className="sh-ban-t">{cur ? <>{catOf(cur, cats)} · <span>{cur.name}</span></> : "طلا و جواهر، با قیمت همین ساعت"}</p>
          <div className="sh-ban-cta">
            <a className="btn btn-gold" href={cur ? link({ p: cur.id }) : "vitrin/"}>{cur ? "دیدن همین کار" : "ورود به ویترین"}</a>
            <a className="btn btn-line" href="vitrin/">همه‌ی ویترین</a>
          </div>
          {slides.length > 1 && <p className="sh-ban-dots">{slides.map((it, i) => <button key={it.id} type="button" aria-label={"کار " + faDigits(i + 1)} aria-pressed={i === at} onClick={() => setAt(i)} />)}</p>}
        </div>
      </section>

      {catTiles.length > 0 && <section className="sh-cats" aria-label="دسته‌ها">
        <ul className="sh-cat-row">
          {catTiles.map(c => (
            <li key={c.name}><a href={link({ c: c.name })}>
              {c.it ? <img src={pic(c.it)} alt="" loading="lazy" decoding="async" /> : <img className="none" src="/leaf.webp" alt="" />}
              <span><b>{c.name}</b><small className="num">{faDigits(c.n)} کار</small></span>
            </a></li>
          ))}
        </ul>
      </section>}

      <div className="sh-shop">
        <Row id="sh-new" title="تازه‌های ویترین" note="آخرین کارهایی که به ویترین آمده" more="vitrin/?g=all" items={all.slice(0, 12)} gp={gp} />
        {budgets.length > 0 && <section className="sh-row" aria-labelledby="sh-bud">
          <div className="sh-row-h"><div><h2 id="sh-bud">خرید بر اساس بودجه</h2><p>با قیمت همین ساعت، به تومان</p></div></div>
          <ul className="sh-budget">{budgets.map(({ b, n, it }) => (
            <li key={b.join("-")}><a href={link({ ...(b[0] ? { pmin: String(b[0]) } : {}), ...(b[1] ? { pmax: String(b[1]) } : {}) })}>
              {it ? <img src={pic(it)} alt="" loading="lazy" decoding="async" /> : <img className="none" src="/leaf.webp" alt="" />}
              <span><b>{budgetName(b)}</b><small className="num">{faDigits(n)} کار</small></span>
            </a></li>))}</ul>
        </section>}
        <Row id="sh-ready" title="آماده‌ی تحویل" note="در فروشگاه هست؛ همین امروز" more="vitrin/?g=all&st=qty" items={ready} gp={gp} />
        <Row id="sh-low" title="کم‌اجرت‌ها" note="کمترین اجرت در ویترین" more="vitrin/?g=all" items={lowWage} gp={gp} />
      </div>
    </>
  );
}
