"use client";
// «ویترین» in «حساب من»: the pieces the owner put on show in the ledger, by category; each opens on its own page with
// its photos and films, weight, karat, wage, today's estimated price (the union board's rate this hour), how it can be
// settled and its description, and an order button that lands in the management panel as a new lead.
import { useEffect, useMemo, useState } from "react";
import { SHOP } from "@/lib/content";
import { openRules } from "./Extras";
import { usePrice } from "@/lib/price";
import { faDigits, gram, mediaUrl, orderItem, SAMPLE_VITRIN, toman, vitrin, ApiError, type VItem } from "@/lib/hesab";

// today's price of a piece, the way the site's own calculator does it: gold at the hour's rate (by its 750-equivalent
// weight), plus the wage, plus the profit, plus 10% tax on the wage and the profit
export function priceOf(it: VItem, gp: number) {
  const gold = it.weight * (it.carat / 750) * gp, ajr = gold * it.ajrat / 100, prof = (gold + ajr) * it.profit / 100, tax = (ajr + prof) * 0.1;
  return { gold, ajr, prof, tax, total: gold + ajr + prof + tax };
}

// in hand with a count / can be ordered / not available
const stockOf = (it: VItem) => it.stock || (it.sold ? "none" : "order");
// the two filters (owner, 2026-11-09): how soon it can be had, and what kind of piece. A category typed «نیم ست» or
// «پا بند» in the ledger counts as «نیم‌ست» / «پابند».
const STOCKS = [["qty", "آماده‌ی تحویل آنی"], ["order", "قابل سفارش"], ["none", "ناموجود"]] as const;
export const VCATS = ["انگشتر", "گردنبند", "دستبند", "گوشواره", "نیم‌ست", "سرویس", "مدال", "زنجیر", "پابند", "النگو", "پلاک و آویز"];
const catKey = (s: string) => s.replace(/[\s\u200c]/g, "");
const catOf = (it: VItem) => { const k = catKey(it.cat || ""); return VCATS.find(c => catKey(c) === k) || it.cat || ""; };
export const stockText = (it: VItem) => stockOf(it) === "qty" ? (it.qty > 0 ? `${faDigits(it.qty)} عدد در فروشگاه` : "موجود در فروشگاه") : stockOf(it) === "order" ? "موجود (قابل سفارش)" : "ناموجود";

function Media({ m, className, controls }: { m: { id: string; type: "image" | "video" }; className?: string; controls?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u = "", dead = false;
    mediaUrl(m.id).then(r => { if (dead) return; u = r; setUrl(r); }).catch(() => {});
    return () => { dead = true; if (u) URL.revokeObjectURL(u); };
  }, [m.id]);
  if (!url) return <span className={(className || "") + " hs-pic-none"} aria-hidden><img src="/leaf.webp" alt="" /></span>;
  return m.type === "video"
    ? <video className={className} src={url} playsInline muted={!controls} loop={!controls} autoPlay={!controls} controls={controls} preload="metadata" />
    : <img className={className} src={url} alt="" />;
}
const Cover = ({ it, className }: { it: VItem; className: string }) => {
  const m = it.media.find(x => x.type === "image") || it.media[0];
  return m ? <Media m={m} className={className} /> : <span className={className + " hs-pic-none"} aria-hidden><img src="/leaf.webp" alt="" /></span>;
};

export default function Vitrin({ demo }: { demo?: boolean }) {
  const [items, setItems] = useState<VItem[] | null>(null);
  const [err, setErr] = useState(false);
  const [cat, setCat] = useState("all");
  const [st, setSt] = useState("all");
  const [open, setOpen] = useState<VItem | null>(null);
  const { feed } = usePrice();
  useEffect(() => {
    if (demo) { setItems(SAMPLE_VITRIN); return; }
    vitrin().then(setItems, () => setErr(true));
  }, [demo]);
  const all = useMemo(() => items || [], [items]);
  const cats = useMemo(() => [...VCATS, ...new Set(all.map(catOf).filter(c => c && !VCATS.includes(c)))], [all]);
  const nCat = (c: string) => all.filter(i => catOf(i) === c && (st === "all" || stockOf(i) === st)).length;
  const nSt = (k: string) => all.filter(i => stockOf(i) === k && (cat === "all" || catOf(i) === cat)).length;
  const shown = all.filter(i => (st === "all" || stockOf(i) === st) && (cat === "all" || catOf(i) === cat));
  const show = (it: VItem | null) => { setOpen(it); scrollTo({ top: 0 }); };

  if (open) return <Product it={open} gp={feed?.gp || 0} demo={demo} onBack={() => show(null)} />;
  return (
    <section className="hs-sec hs-vit" aria-labelledby="hs-vit">
      <div className="hs-box-head">
        <h2 className="hs-h" id="hs-vit">ویترین لئون گلد</h2>
        <p>کارهای موجود، با قیمت تقریبیِ همین ساعت{feed?.time ? ` (نرخ اتحادیه، ساعت ${faDigits(feed.time)})` : ""}.</p>
      </div>
      {all.length > 0 && (
        <div className="hs-vfilter">
          <label className={"hs-vsel" + (st !== "all" ? " on" : "")}><span className="hs-sr">وضعیت</span>
            <select value={st} onChange={e => setSt(e.target.value)} aria-label="وضعیت">
              <option value="all">همه‌ی وضعیت‌ها</option>
              {STOCKS.map(([k, t]) => { const n = nSt(k); return <option key={k} value={k} disabled={!n && st !== k}>{t} ({faDigits(n)})</option>; })}
            </select>
          </label>
          <label className={"hs-vsel" + (cat !== "all" ? " on" : "")}><span className="hs-sr">دسته</span>
            <select value={cat} onChange={e => setCat(e.target.value)} aria-label="دسته">
              <option value="all">همه‌ی دسته‌ها</option>
              {cats.map(c => { const n = nCat(c); return <option key={c} value={c} disabled={!n && cat !== c}>{c} ({faDigits(n)})</option>; })}
            </select>
          </label>
        </div>
      )}
      {err ? <p className="hs-empty">ویترین باز نشد. اینترنت را بررسی کنید و دوباره سر بزنید.</p>
        : !items ? <p className="hs-empty">در حال آوردن ویترین…</p>
        : !all.length ? <p className="hs-empty">فعلاً کاری در ویترین نیست. به‌زودی کارهای تازه اینجا می‌آید.</p>
        : !shown.length ? <p className="hs-empty">با این انتخاب کاری نیست. <button type="button" className="hs-link" onClick={() => { setSt("all"); setCat("all"); }}>همه را نشان بده</button></p>
        : (
          <ul className="hs-vgrid">
            {shown.map(it => (
              <li key={it.id}>
                <button type="button" className="hs-vcard paper" onClick={() => show(it)}>
                  <span className="hs-vcard-pic"><Cover it={it} className="hs-vimg" />{it.media.some(m => m.type === "video") && <i className="hs-vplay" aria-label="فیلم دارد">▶</i>}{stockOf(it) === "none" ? <em className="hs-vsold">ناموجود</em> : <em className={"hs-vstock " + stockOf(it)}>{stockOf(it) === "qty" ? "آماده‌ی تحویل" : "قابل سفارش"}</em>}</span>
                  <b>{it.name}</b>
                  <span className="num">{gram(it.weight)} گرم · عیار {faDigits(it.carat)}</span>
                  {feed?.gp ? <strong className="num">≈ {toman(priceOf(it, feed.gp).total)} <small>تومان</small></strong> : <strong>قیمت با نرخ روز</strong>}
                </button>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

function Product({ it, gp, demo, onBack }: { it: VItem; gp: number; demo?: boolean; onBack: () => void }) {
  const [at, setAt] = useState(0);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"" | "busy" | "done" | "err" | "many">("");
  const p = gp ? priceOf(it, gp) : null;
  const order = async () => {
    if (demo) { setState("done"); return; }
    setState("busy");
    try { await orderItem(it.id, note.trim()); setState("done"); }
    catch (e) { setState(e instanceof ApiError && e.code === "too_many" ? "many" : "err"); }
  };
  const media = it.media.length ? it.media : [];
  return (
    <article className="hs-prod" aria-label={it.name}>
      <button type="button" className="hs-link hs-prod-back" onClick={onBack}>→ ویترین</button>
      <div className="hs-gal paper">
        {media.length ? (
          <div className="hs-gal-track" onScroll={e => { const el = e.currentTarget; setAt(Math.round(Math.abs(el.scrollLeft) / el.clientWidth)); }}>
            {media.map(m => <div key={m.id} className="hs-gal-it"><Media m={m} className="hs-gal-m" controls={m.type === "video"} /></div>)}
          </div>
        ) : <div className="hs-gal-it"><span className="hs-gal-m hs-pic-none" aria-hidden><img src="/leaf.webp" alt="" /></span></div>}
        {media.length > 1 && <p className="hs-gal-dots" aria-hidden>{media.map((m, i) => <i key={m.id} className={i === at ? "on" : ""} />)}</p>}
        {stockOf(it) === "none" && <em className="hs-vsold">ناموجود</em>}
      </div>
      <header className="hs-prod-h">
        <p className="hs-prod-k">{[it.cat, it.code && "کد " + faDigits(it.code)].filter(Boolean).join(" · ")}</p>
        <h1>{it.name}</h1>
      </header>
      <section className="hs-prod-price paper" aria-label="قیمت تقریبی امروز">
        <p className="hs-prod-pk">قیمت تقریبی با نرخ همین ساعت</p>
        <p className="hs-prod-pv num">{p ? toman(p.total) : "…"} <small>تومان</small></p>
        {p && <dl className="hs-prod-break">
          <div><dt>طلا ({gram(it.weight)} گرم، عیار {faDigits(it.carat)})</dt><dd className="num">{toman(p.gold)}</dd></div>
          <div><dt>اجرت ({faDigits(it.ajrat)}٪)</dt><dd className="num">{toman(p.ajr)}</dd></div>
          <div><dt>سود ({faDigits(it.profit)}٪)</dt><dd className="num">{toman(p.prof)}</dd></div>
          <div><dt>مالیات بر اجرت و سود (۱۰٪)</dt><dd className="num">{toman(p.tax)}</dd></div>
        </dl>}
        <p className="hs-prod-fine">قیمت نهایی با نرخ لحظه‌ی خرید حساب می‌شود.</p>
      </section>
      <section className="hs-prod-spec paper" aria-label="مشخصات">
        <dl>
          <div><dt>وزن</dt><dd className="num">{gram(it.weight)} گرم</dd></div>
          <div><dt>عیار</dt><dd className="num">{faDigits(it.carat)}</dd></div>
          <div><dt>اجرت</dt><dd className="num">{faDigits(it.ajrat)}٪</dd></div>
          <div><dt>موجودی</dt><dd>{stockText(it)}</dd></div>
        </dl>
        {(it.settle.length > 0 || it.settleNote) && <div className="hs-prod-settle"><h2>مدت تسویه</h2>
          {it.settle.length > 0 && <p className="hs-chips">{it.settle.map(s => <span key={s}>{s}</span>)}</p>}
          {it.settleNote && <p>{it.settleNote}</p>}</div>}
        {it.desc && <div className="hs-prod-desc"><h2>توضیحات</h2><p>{it.desc}</p></div>}
      </section>
      <section className="hs-prod-order paper" aria-label="سفارش">
        {stockOf(it) === "none" ? <>
          <h2>فعلاً ناموجود</h2>
          <p className="hs-prod-fine">این کار در حال حاضر نه در فروشگاه هست و نه سفارش گرفته می‌شود. برای کار مشابه در تلگرام بپرسید.</p>
          <a className="btn btn-ink hs-prod-tg" href={SHOP.telegram} target="_blank" rel="noopener">پرسیدن در تلگرام</a>
        </> : state === "done" ? (
          <p className="hs-ok">✦ سفارش «{it.name}» ثبت شد. لئون گلد به‌زودی با شما تماس می‌گیرد. ✦</p>
        ) : <>
          <h2>{stockOf(it) === "qty" ? "خرید این کار" : "سفارش این کار"}</h2>
          <label className="hs-field"><span>توضیح (اختیاری): سایز، رنگ طلا، زمان تحویل…</span>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500} />
          </label>
          {state === "err" && <p className="hs-err" role="alert">سفارش ثبت نشد. اینترنت را بررسی کنید و دوباره بزنید.</p>}
          {state === "many" && <p className="hs-err" role="alert">امروز چند سفارش ثبت کرده‌اید؛ برای بیشتر در تلگرام پیام بدهید.</p>}
          <button type="button" className="btn btn-gold" disabled={state === "busy"} onClick={order}>{state === "busy" ? "در حال ثبت…" : "ثبت سفارش"}</button>
          <p className="hs-prod-fine">با ثبت سفارش، <button type="button" className="hs-link hs-inline" onClick={openRules}>آیین‌نامه‌ی خرید و فروش لئون گلد</button> را می‌پذیرید.</p>
          <a className="hs-link" href={SHOP.telegram} target="_blank" rel="noopener">یا در تلگرام بپرسید</a>
        </>}
      </section>
    </article>
  );
}
