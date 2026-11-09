"use client";
// «ویترین» in «حساب من»: the pieces the owner put on show in the ledger, by category; each opens on its own page with
// its photos and films, weight, karat, wage, today's estimated price (the union board's rate this hour), how it can be
// settled and its description, and an order button that lands in the management panel as a new lead.
import { useEffect, useMemo, useState } from "react";
import { SHOP, TAX, TAX_FA } from "@/lib/content";
import { openRules } from "./Extras";
import Jewel from "@/components/Jewel";
import { refreshPrice, usePrice } from "@/lib/price";
import { faDigits, gram, latin, mediaUrl, orderItem, orderPrice, orderStatus, publicMedia, publicVitrin, SAMPLE_VITRIN, toman, vitrin, ApiError, type VItem } from "@/lib/hesab";

// today's price of a piece, the way the site's own calculator does it: gold at the hour's rate (by its 750-equivalent
// weight), plus the wage, plus the profit, plus the tax (TAX, 3%) on all of it
export function priceOf(it: VItem, gp: number) {
  const gold = it.weight * (it.carat / 750) * gp, ajr = gold * it.ajrat / 100, prof = (gold + ajr) * it.profit / 100, tax = (gold + ajr + prof) * TAX;
  return { gold, ajr, prof, tax, total: gold + ajr + prof + tax };
}

// in hand with a count / can be ordered / not available
export const stockOf = (it: VItem) => it.stock || (it.sold ? "none" : "order");
// the two filters (owner, 2026-11-09): how soon it can be had, and what kind of piece. A category typed «نیم ست» or
// «پا بند» in the ledger counts as «نیم‌ست» / «پابند».
const STOCKS = [["qty", "آماده‌ی تحویل آنی"], ["order", "قابل سفارش"], ["none", "ناموجود"]] as const;
export const VCATS = ["انگشتر", "گردنبند", "دستبند", "گوشواره", "نیم‌ست", "سرویس", "مدال", "زنجیر", "پابند", "النگو", "پلاک و آویز"];
const catKey = (s: string) => s.replace(/[\s\u200c]/g, "");
export const catOf = (it: VItem) => { const k = catKey(it.cat || ""); return VCATS.find(c => catKey(c) === k) || it.cat || ""; };
// «نوع کار» (owner, 2026-11-09): the owner's tags in the ledger; a piece may have several
export const VTAGS = ["لوکس", "مینیمال", "لیزری", "ریخته"];
const numIn = (s: string) => { const v = parseFloat(latin(s).replace(/[٫,]/g, ".").replace(/[^\d.]/g, "")); return isFinite(v) ? v : null; };
// a wage the buyer types: the pieces at that wage and at the nearest wage below and above it, nearest first
function nearWage(L: VItem[], x: number) {
  const vals = [...new Set(L.map(i => i.ajrat))].sort((a, b) => a - b);
  const lo = vals.filter(v => v < x).pop(), hi = vals.find(v => v > x), keep = new Set([x, lo, hi].filter(v => v !== undefined));
  return L.filter(i => keep.has(i.ajrat)).sort((a, b) => Math.abs(a.ajrat - x) - Math.abs(b.ajrat - x));
}
export const stockText = (it: VItem) => stockOf(it) === "qty" ? (it.qty > 0 ? `${faDigits(it.qty)} عدد در فروشگاه` : "موجود در فروشگاه") : stockOf(it) === "order" ? "موجود (قابل سفارش)" : "ناموجود";

function Media({ m, className, controls, pub }: { m: { id: string; type: "image" | "video" }; className?: string; controls?: boolean; pub?: boolean }) {
  const [url, setUrl] = useState<string | null>(pub ? publicMedia(m.id) : null);
  useEffect(() => {
    if (pub) return;
    let u = "", dead = false;
    mediaUrl(m.id).then(r => { if (dead) return; u = r; setUrl(r); }).catch(() => {});
    return () => { dead = true; if (u) URL.revokeObjectURL(u); };
  }, [m.id, pub]);
  if (!url) return <span className={(className || "") + " hs-pic-none"} aria-hidden><img src="/leaf.webp" alt="" /></span>;
  return m.type === "video"
    ? <video className={className} src={url} playsInline muted={!controls} loop={!controls} autoPlay={!controls} controls={controls} preload="metadata" />
    : <img className={className} src={url} alt="" />;
}
export const Cover = ({ it, className, pub }: { it: VItem; className: string; pub?: boolean }) => {
  const m = it.media.find(x => x.type === "image") || it.media[0];
  return m ? <Media m={m} className={className} pub={pub} /> : <span className={className + " hs-pic-none"} aria-hidden><img src="/leaf.webp" alt="" /></span>;
};

// the categories first (owner, 2026-11-09): every category, each with a photo of its newest piece, or its drawing
// when it has none yet («به‌زودی»); a tap opens that category's pieces. Used on the home page and atop «ویترین».
const ART: Record<string, string> = { "انگشتر": "ring", "گردنبند": "necklace", "دستبند": "bracelet", "گوشواره": "earring", "نیم‌ست": "set", "سرویس": "set", "مدال": "coin", "زنجیر": "necklace", "پابند": "bracelet", "النگو": "bracelet", "پلاک و آویز": "necklace" };
export const catsOf = (all: VItem[]) => [...VCATS, ...new Set(all.map(catOf).filter(c => c && !VCATS.includes(c)))];
export function CatGrid({ items, pub, href, onPick }: { items: VItem[] | null; pub?: boolean; href?: (c: string) => string; onPick?: (c: string) => void }) {
  const all = items || [];
  return (
    <ul className="vc-grid">
      {catsOf(all).map((c, i) => {
        const L = all.filter(it => catOf(it) === c), n = L.length;
        const face = L.find(it => stockOf(it) !== "none" && it.media.some(m => m.type === "image")) || L.find(it => it.media.some(m => m.type === "image")) || L.find(it => it.media.length);
        const inner = <>
          <span className="vc-pic">{face ? <Cover it={face} className="vc-img" pub={pub} /> : <span className="vc-art"><Jewel kind={ART[c] || "ring"} id={"vc" + i} /></span>}</span>
          <b>{c}</b>
          <small className="num">{!items ? "\u00a0" : n ? `${faDigits(n)} کار` : "به‌زودی"}</small>
        </>;
        const cls = "vc-card" + (items && !n ? " empty" : "");
        return <li key={c}>{href ? <a className={cls} href={href(c)}>{inner}</a> : <button type="button" className={cls} onClick={() => onPick?.(c)}>{inner}</button>}</li>;
      })}
    </ul>
  );
}

// pub: the public site's showcase (no sign-in; its order button leads to «حساب من»). openId: open this piece first
// (from the site's order button, after signing in or signing up)
// onlyMine: a supplier that does not buy sees only its own pieces («محصولات شما در لئون»), not Leon's prices
export default function Vitrin({ demo, pub, openId, onlyMine }: { demo?: boolean; pub?: boolean; openId?: string; onlyMine?: boolean }) {
  const [items, setItems] = useState<VItem[] | null>(null);
  const [mine, setMine] = useState<VItem[]>([]);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState<VItem | null>(null);
  const [cat, setCat] = useState(onlyMine ? "all" : "");
  // on the site the category is in the address (vitrin/?c=دستبند), so a link from the home page opens it and «back» returns
  const goCat = (c: string, keep?: boolean) => {
    setCat(c);
    if (pub && typeof history !== "undefined") history[keep ? "replaceState" : "pushState"](null, "", c ? "?c=" + encodeURIComponent(c) : location.pathname);
    if (!keep) scrollTo({ top: 0 });
  };
  useEffect(() => {
    if (!pub) return;
    const read = () => { setCat(new URLSearchParams(location.search).get("c") || ""); setOpen(null); };
    read(); addEventListener("popstate", read);
    return () => removeEventListener("popstate", read);
  }, [pub]);
  const [st, setSt] = useState("all");
  const [tag, setTag] = useState("all");
  const [more, setMore] = useState(false);
  const [r, setR] = useState({ wMin: "", wMax: "", aMin: "", aMax: "", aNear: "" });
  const setRv = (k: keyof typeof r) => (e: React.ChangeEvent<HTMLInputElement>) => setR({ ...r, [k]: e.target.value });
  const { feed } = usePrice();
  useEffect(() => {
    if (demo) { setItems(SAMPLE_VITRIN); return; }
    (pub ? publicVitrin().then(items => ({ items, mine: [] as VItem[] })) : vitrin()).then(({ items: L, mine: M }) => { setItems(L); setMine(M); const o = openId && L.find(x => x.id === openId); if (o) { setOpen(o); setCat(catOf(o) || "all"); } }, () => setErr(true));
  }, [demo, pub, openId]);
  const all = useMemo(() => items || [], [items]);
  const cats = useMemo(() => [...VCATS, ...new Set(all.map(catOf).filter(c => c && !VCATS.includes(c)))], [all]);
  const tags = useMemo(() => [...VTAGS.filter(t => all.some(i => i.tags?.includes(t))), ...new Set(all.flatMap(i => i.tags || []).filter(t => !VTAGS.includes(t)))], [all]);
  // weight and wage: a range, or a wage typed (with its nearest neighbours)
  const wMin = numIn(r.wMin), wMax = numIn(r.wMax), aMin = numIn(r.aMin), aMax = numIn(r.aMax), aNear = numIn(r.aNear);
  const inRange = (i: VItem) => (wMin == null || i.weight >= wMin) && (wMax == null || i.weight <= wMax) && (aMin == null || i.ajrat >= aMin) && (aMax == null || i.ajrat <= aMax);
  const okSt = (i: VItem) => st === "all" || stockOf(i) === st, okCat = (i: VItem) => cat === "all" || cat === "" || catOf(i) === cat, okTag = (i: VItem) => tag === "all" || !!i.tags?.includes(tag);
  const nCat = (c: string) => all.filter(i => catOf(i) === c && okSt(i) && okTag(i) && inRange(i)).length;
  const nSt = (k: string) => all.filter(i => stockOf(i) === k && okCat(i) && okTag(i) && inRange(i)).length;
  const nTag = (t: string) => all.filter(i => i.tags?.includes(t) && okSt(i) && okCat(i) && inRange(i)).length;
  const pool = all.filter(i => okSt(i) && okCat(i) && okTag(i) && inRange(i));
  const shown = aNear == null ? pool : nearWage(pool, aNear);
  const nMore = [r.wMin, r.wMax, r.aMin, r.aMax, r.aNear].filter(v => v.trim()).length;
  const reset = () => { setSt("all"); setTag("all"); setR({ wMin: "", wMax: "", aMin: "", aMax: "", aNear: "" }); };
  const show = (it: VItem | null) => { setOpen(it); scrollTo({ top: 0 }); };

  if (open) return <Product it={open} gp={feed?.gp || 0} demo={demo} pub={pub} onBack={() => show(null)} />;
  return (
    <>
    {onlyMine && items && !mine.length && <section className="hs-sec hs-vit hs-mine"><div className="hs-box-head"><h2 className="hs-h">محصولات شما در لئون</h2><p>هنوز کاری از شما در ویترین لئون گلد نیست.</p></div></section>}
    {mine.length > 0 && (
      <section className="hs-sec hs-vit hs-mine" aria-labelledby="hs-mine">
        <div className="hs-box-head">
          <h2 className="hs-h" id="hs-mine">محصولات شما در لئون</h2>
          <p>کارهایی که ساخته‌اید و در ویترین لئون گلد گذاشته شده؛ {faDigits(mine.length)} کار.</p>
        </div>
        <ul className="hs-vgrid">
          {mine.map(it => (
            <li key={it.id}>
              <button type="button" className="hs-vcard paper" onClick={() => show(it)}>
                <span className="hs-vcard-pic"><Cover it={it} className="hs-vimg" />{stockOf(it) === "none" ? <em className="hs-vsold">ناموجود</em> : <em className={"hs-vstock " + stockOf(it)}>{stockOf(it) === "qty" ? "در فروشگاه" : "قابل سفارش"}</em>}</span>
                <b>{it.name}</b>
                <span className="num">{gram(it.weight)} گرم · عیار {faDigits(it.carat)}</span>
                {!!it.tags?.length && <span className="hs-vtags">{it.tags.join(" · ")}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    )}
    {!onlyMine && cat === "" && <section className="hs-sec hs-vit" aria-labelledby="hs-vit">
      <div className="hs-box-head">
        <h2 className="hs-h" id="hs-vit">ویترین لئون گلد</h2>
        <p>{err ? "ویترین باز نشد. اینترنت را بررسی کنید و دوباره سر بزنید." : "یک دسته را انتخاب کنید تا کارهایش را با قیمت همین ساعت ببینید."}</p>
      </div>
      <CatGrid items={err ? null : items} pub={pub} onPick={c => goCat(c)} />
      {all.length > 0 && <p className="vc-all"><button type="button" className="btn btn-line" onClick={() => goCat("all")}>همه‌ی کارها با هم ({faDigits(all.length)})</button></p>}
    </section>}
    {!onlyMine && cat !== "" && <section className="hs-sec hs-vit" aria-labelledby="hs-vit">
      <button type="button" className="hs-link vc-back" onClick={() => goCat("")}>→ همه‌ی دسته‌ها</button>
      <div className="hs-box-head">
        <h2 className="hs-h" id="hs-vit">{cat === "all" ? "همه‌ی کارهای ویترین" : cat}</h2>
        <p>کارهای موجود، با قیمت تقریبیِ همین ساعت{feed?.time ? ` (نرخ اتحادیه، ساعت ${faDigits(feed.time)})` : ""}.{pub ? " برای سفارش، روی هر کار بزنید." : ""}</p>
      </div>
      {all.length > 0 && (<>
        <div className="hs-vfilter hs-vfilter4">
          <label className={"hs-vsel" + (st !== "all" ? " on" : "")}><span className="hs-sr">وضعیت</span>
            <select value={st} onChange={e => setSt(e.target.value)} aria-label="وضعیت">
              <option value="all">همه‌ی وضعیت‌ها</option>
              {STOCKS.map(([k, t]) => { const n = nSt(k); return <option key={k} value={k} disabled={!n && st !== k}>{t} ({faDigits(n)})</option>; })}
            </select>
          </label>
          <label className={"hs-vsel" + (cat !== "all" ? " on" : "")}><span className="hs-sr">دسته</span>
            <select value={cat} onChange={e => goCat(e.target.value, true)} aria-label="دسته">
              <option value="all">همه‌ی دسته‌ها</option>
              {cats.map(c => { const n = nCat(c); return <option key={c} value={c} disabled={!n && cat !== c}>{c} ({faDigits(n)})</option>; })}
            </select>
          </label>
          <label className={"hs-vsel" + (tag !== "all" ? " on" : "")}><span className="hs-sr">نوع کار</span>
            <select value={tag} onChange={e => setTag(e.target.value)} aria-label="نوع کار">
              <option value="all">همه‌ی انواع کار</option>
              {tags.map(t => { const n = nTag(t); return <option key={t} value={t} disabled={!n && tag !== t}>{t} ({faDigits(n)})</option>; })}
            </select>
          </label>
          <button type="button" className={"hs-vmore-b" + (nMore ? " on" : "")} aria-expanded={more} onClick={() => setMore(!more)}>وزن و اجرت{nMore ? ` (${faDigits(nMore)})` : ""}</button>
        </div>
        {more && (
          <div className="hs-vmore paper">
            <div className="hs-vrange"><span>وزن (گرم)</span>
              <input value={r.wMin} onChange={setRv("wMin")} inputMode="decimal" placeholder="از" aria-label="وزن از" />
              <input value={r.wMax} onChange={setRv("wMax")} inputMode="decimal" placeholder="تا" aria-label="وزن تا" /></div>
            <div className="hs-vrange"><span>اجرت (٪)</span>
              <input value={r.aMin} onChange={setRv("aMin")} inputMode="decimal" placeholder="حداقل" aria-label="کمترین اجرت" />
              <input value={r.aMax} onChange={setRv("aMax")} inputMode="decimal" placeholder="حداکثر" aria-label="بیشترین اجرت" /></div>
            <div className="hs-vrange hs-vnear"><span>یا اجرت مورد نظر</span>
              <input value={r.aNear} onChange={setRv("aNear")} inputMode="decimal" placeholder="مثلاً ۱۸" aria-label="اجرت مورد نظر" /></div>
            <p className="hs-vmore-fine">با نوشتن اجرت مورد نظر، کارهای همان اجرت و نزدیک‌ترین اجرت پایین‌تر و بالاتر نشان داده می‌شود.</p>
            {nMore > 0 && <button type="button" className="hs-link" onClick={() => setR({ wMin: "", wMax: "", aMin: "", aMax: "", aNear: "" })}>پاک کردن وزن و اجرت</button>}
          </div>
        )}
      </>)}
      {err ? <p className="hs-empty">ویترین باز نشد. اینترنت را بررسی کنید و دوباره سر بزنید.</p>
        : !items ? <p className="hs-empty">در حال آوردن ویترین…</p>
        : cat !== "all" && !all.some(i => catOf(i) === cat) ? <p className="hs-empty">فعلاً کاری در «{cat}» در ویترین نیست؛ به‌زودی می‌آید.{pub && <> اگر کار خاصی می‌خواهید، <a href="../#order">سفارش ساختش</a> را بدهید.</>}</p>
        : !all.length ? <p className="hs-empty">فعلاً کاری در ویترین نیست. به‌زودی کارهای تازه اینجا می‌آید.</p>
        : !shown.length ? <p className="hs-empty">با این انتخاب کاری نیست. <button type="button" className="hs-link" onClick={reset}>همه را نشان بده</button></p>
        : (
          <ul className="hs-vgrid">
            {shown.map(it => (
              <li key={it.id}>
                <button type="button" className="hs-vcard paper" onClick={() => show(it)}>
                  <span className="hs-vcard-pic"><Cover it={it} className="hs-vimg" pub={pub} />{it.media.some(m => m.type === "video") && <i className="hs-vplay" aria-label="فیلم دارد">▶</i>}{stockOf(it) === "none" ? <em className="hs-vsold">ناموجود</em> : <em className={"hs-vstock " + stockOf(it)}>{stockOf(it) === "qty" ? "آماده‌ی تحویل" : "قابل سفارش"}</em>}</span>
                  <b>{it.name}</b>
                  <span className="num">{gram(it.weight)} گرم · عیار {faDigits(it.carat)} · اجرت {faDigits(it.ajrat)}٪</span>
                  {!!it.tags?.length && <span className="hs-vtags">{it.tags.join(" · ")}</span>}
                  {feed?.gp ? <strong className="num">≈ {toman(priceOf(it, feed.gp).total)} <small>تومان</small></strong> : <strong>قیمت با نرخ روز</strong>}
                </button>
              </li>
            ))}
          </ul>
        )}
    </section>}
    </>
  );
}

function Product({ it, gp, demo, pub, onBack }: { it: VItem; gp: number; demo?: boolean; pub?: boolean; onBack: () => void }) {
  const [at, setAt] = useState(0);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"" | "busy" | "wait" | "done" | "late" | "err" | "many">("");
  const p = gp ? priceOf(it, gp) : null;
  // waiting for Leon's confirmation: the order's id, its deadline, the price it was sent with, and a price change seen meanwhile
  const [w, setW] = useState<{ id: string; end: number; gp: number; total: number } | null>(null);
  const [left, setLeft] = useState(0);
  const [moved, setMoved] = useState<{ from: number; to: number } | null>(null);
  const order = async () => {
    setState("busy"); setMoved(null);
    const total = p ? Math.round(p.total) : 0;
    if (demo) { setW({ id: "demo", end: Date.now() + 120000, gp, total }); setState("wait"); setTimeout(() => setState(s => s === "wait" ? "done" : s), 6000); return; }
    try { const r = await orderItem(it.id, note.trim(), gp || undefined, total || undefined); setW({ id: r.id, end: Date.now() + r.wait * 1000, gp, total }); setState("wait"); }
    catch (e) { setState(e instanceof ApiError && e.code === "too_many" ? "many" : "err"); }
  };
  // the countdown, Leon's answer (every 3 s), and the gold rate (every 15 s) while it waits
  useEffect(() => {
    if (state !== "wait" || !w) return;
    const tick = () => { const l = Math.max(0, Math.ceil((w.end - Date.now()) / 1000)); setLeft(l); if (l <= 0 && !demo) setState("late"); };
    tick();
    const t1 = setInterval(tick, 1000);
    const t2 = demo ? 0 : setInterval(() => { orderStatus(w.id).then(r => { if (r.status === "confirmed") setState("done"); else if (r.status === "expired") setState("late"); }, () => {}); }, 3000);
    const t3 = setInterval(() => { refreshPrice(); }, 15000);
    return () => { clearInterval(t1); if (t2) clearInterval(t2); clearInterval(t3); };
  }, [state, w, demo]);
  // the waiting, confirmed or late box comes into view
  useEffect(() => { if (state === "wait" || state === "done" || state === "late") document.querySelector(".hs-prod-order")?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [state]);
  // the rate moved while it waits: tell the buyer, and send the new price with the order
  useEffect(() => {
    if (state !== "wait" || !w || !gp || gp === w.gp) return;
    const total = Math.round(priceOf(it, gp).total);
    setMoved({ from: w.total, to: total });
    setW({ ...w, gp, total });
    if (!demo) orderPrice(w.id, gp, total).catch(() => {});
  }, [gp, state, w, it, demo]);
  const media = it.media.length ? it.media : [];
  return (
    <article className="hs-prod" aria-label={it.name}>
      <button type="button" className="hs-link hs-prod-back" onClick={onBack}>{it.mine ? "→ محصولات من" : "→ ویترین"}</button>
      <div className="hs-gal paper">
        {media.length ? (
          <div className="hs-gal-track" onScroll={e => { const el = e.currentTarget; setAt(Math.round(Math.abs(el.scrollLeft) / el.clientWidth)); }}>
            {media.map(m => <div key={m.id} className="hs-gal-it"><Media m={m} className="hs-gal-m" controls={m.type === "video"} pub={pub} /></div>)}
          </div>
        ) : <div className="hs-gal-it"><span className="hs-gal-m hs-pic-none" aria-hidden><img src="/leaf.webp" alt="" /></span></div>}
        {media.length > 1 && <p className="hs-gal-dots" aria-hidden>{media.map((m, i) => <i key={m.id} className={i === at ? "on" : ""} />)}</p>}
        {stockOf(it) === "none" && <em className="hs-vsold">ناموجود</em>}
      </div>
      <header className="hs-prod-h">
        <p className="hs-prod-k">{[it.cat, ...(it.tags || []), it.code && "کد " + faDigits(it.code)].filter(Boolean).join(" · ")}</p>
        <h1>{it.name}</h1>
      </header>
      {it.mine ? <section className="hs-prod-price paper" aria-label="کار شما"><p className="hs-prod-pk">محصول شما در لئون</p><p className="hs-prod-fine">این کار را شما ساخته‌اید و در ویترین لئون گلد گذاشته شده است.</p></section> : <section className="hs-prod-price paper" aria-label="قیمت تقریبی امروز">
        <p className="hs-prod-pk">قیمت تقریبی با نرخ همین ساعت</p>
        <p className="hs-prod-pv num">{p ? toman(p.total) : "…"} <small>تومان</small></p>
        {p && <dl className="hs-prod-break">
          <div><dt>طلا ({gram(it.weight)} گرم، عیار {faDigits(it.carat)})</dt><dd className="num">{toman(p.gold)}</dd></div>
          <div><dt>اجرت ({faDigits(it.ajrat)}٪)</dt><dd className="num">{toman(p.ajr)}</dd></div>
          <div><dt>سود ({faDigits(it.profit)}٪)</dt><dd className="num">{toman(p.prof)}</dd></div>
          <div><dt>مالیات بر ارزش افزوده ({TAX_FA} کل)</dt><dd className="num">{toman(p.tax)}</dd></div>
        </dl>}
        <p className="hs-prod-fine">قیمت نهایی با نرخ لحظه‌ی خرید حساب می‌شود.</p>
      </section>}
      <section className="hs-prod-spec paper" aria-label="مشخصات">
        <dl>
          <div><dt>وزن</dt><dd className="num">{gram(it.weight)} گرم</dd></div>
          <div><dt>عیار</dt><dd className="num">{faDigits(it.carat)}</dd></div>
          {!it.mine && <div><dt>اجرت</dt><dd className="num">{faDigits(it.ajrat)}٪</dd></div>}
          <div><dt>موجودی</dt><dd>{stockText(it)}</dd></div>
        </dl>
        {!it.mine && ((it.settle || []).length > 0 || it.settleNote) && <div className="hs-prod-settle"><h2>مدت تسویه</h2>
          {it.settle.length > 0 && <p className="hs-chips">{it.settle.map(s => <span key={s}>{s}</span>)}</p>}
          {it.settleNote && <p>{it.settleNote}</p>}</div>}
        {it.desc && <div className="hs-prod-desc"><h2>توضیحات</h2><p>{it.desc}</p></div>}
      </section>
      {!it.mine && <section className="hs-prod-order paper" aria-label="سفارش">
        {stockOf(it) === "none" ? <>
          <h2>فعلاً ناموجود</h2>
          <p className="hs-prod-fine">این کار در حال حاضر نه در فروشگاه هست و نه سفارش گرفته می‌شود. برای کار مشابه در تلگرام بپرسید.</p>
          <a className="btn btn-ink hs-prod-tg" href={SHOP.telegram} target="_blank" rel="noopener">پرسیدن در تلگرام</a>
        </> : pub ? <>
          <h2>{stockOf(it) === "qty" ? "خرید این کار" : "سفارش این کار"}</h2>
          <p className="hs-prod-fine">برای ثبت سفارش وارد «حساب من» شوید؛ اگر حساب ندارید، همان‌جا در یک دقیقه بسازید. سفارش شما با همین کار ثبت می‌شود.</p>
          <a className="btn btn-gold" href={`../hesab/?t=vitrin&p=${encodeURIComponent(it.id)}`}>ثبت سفارش</a>
          <a className="hs-link" href={SHOP.telegram} target="_blank" rel="noopener">یا در تلگرام بپرسید</a>
        </> : state === "wait" && w ? (
          <div className="hs-wait-box" role="status" aria-live="polite">
            <div className="hs-ring" style={{ "--p": left / 120 } as React.CSSProperties}><b className="num">{faDigits(left)}</b><small>ثانیه</small></div>
            <h2>در انتظار تایید لئون گلد</h2>
            <p className="hs-prod-fine">سفارش «{it.name}» رسید. تا {faDigits(left)} ثانیه‌ی دیگر لئون گلد آن را تایید می‌کند؛ این صفحه را باز نگه دارید.</p>
            {w.total > 0 && <p className="hs-wait-price">قیمت سفارش: <b className="num">{toman(w.total)}</b> تومان</p>}
            {moved && <p className="hs-err hs-moved" role="alert">قیمت طلا همین الان تغییر کرد؛ قیمت سفارش شما به‌روز شد: از {toman(moved.from)} به <b>{toman(moved.to)}</b> تومان.</p>}
          </div>
        ) : state === "done" ? (
          <div className="hs-wait-box">
            <p className="hs-ok">✦ سفارش «{it.name}» تایید شد. ✦</p>
            {w && w.total > 0 && <p className="hs-wait-price">قیمت سفارش: <b className="num">{toman(w.total)}</b> تومان</p>}
            <p className="hs-prod-fine">لئون گلد برای پرداخت و تحویل با شما تماس می‌گیرد. وضعیت سفارش را در «سفارش‌ها» می‌بینید.</p>
          </div>
        ) : state === "late" ? (
          <div className="hs-wait-box" role="alert">
            <h2>سفارش تایید نشد</h2>
            <p className="hs-prod-fine">سفارش شما در ۱۲۰ ثانیه تایید نشد. لطفاً دوباره تلاش کنید.</p>
            <button type="button" className="btn btn-gold" onClick={() => { setState(""); setW(null); setMoved(null); }}>دوباره تلاش کنید</button>
            <a className="hs-link" href={SHOP.telegram} target="_blank" rel="noopener">یا در تلگرام بپرسید</a>
          </div>
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
      </section>}
    </article>
  );
}
