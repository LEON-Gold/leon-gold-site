"use client";
// «خرید و فروش آبشده» in «حساب من» (owner, 2026-11-16): for colleagues only. The manager's message, then each item with
// its buy and sell price (the melt seller's live price with Leon's margin, from the server; nothing is worked out here),
// a quantity, the total, and 120 seconds for Leon to approve. If the price moves meanwhile, the new price and total show
// above the countdown and the colleague must accept them before Leon's approval can go through.
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, faDigits, meltAccept, meltBoard, meltCancel, meltGet, meltOrder, toman, type MeltBoard, type MeltItem, type MeltOrder } from "@/lib/hesab";
import "./melt.css";

const fa = (n: number, d = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: d });
const ERR: Record<string, string> = {
  bad_qty: "مقدار درست نیست (آبشده و گرم تا ۳ رقم اعشار، سکه و شمش عدد صحیح).", no_price: "قیمت این قلم الان نمی‌آید؛ کمی بعد دوباره بزنید.",
  one_open: "یک سفارش شما هنوز منتظر تایید است.", off: "خرید و فروش آبشده الان بسته است.", too_many: "سفارش زیاد بود؛ کمی بعد دوباره بزنید.",
  offline: "اینترنت وصل نیست.", colleagues_only: "این بخش فقط برای همکاران است.",
};
const ST: Record<string, string> = { done: "انجام شد", rejected: "لئون گلد تایید نکرد", expired: "در ۱۲۰ ثانیه تایید نشد", cancelled: "لغو شد",
  failed: "انجام نشد", unknown: "در حال بررسی؛ نتیجه را لئون گلد خبر می‌دهد", placing: "در حال ثبت…" };
// what a colleague may type: Persian or Latin digits, one decimal point
const cleanQty = (s: string) => s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٫,]/g, ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
const qtyOk = (s: string, dec: number) => new RegExp(dec ? "^\\d{1,6}(\\.\\d{1,3})?$" : "^\\d{1,6}$").test(s) && +s > 0;

export default function Melt() {
  const [b, setB] = useState<MeltBoard | null>(null);
  const [pick, setPick] = useState<{ it: MeltItem; side: "buy" | "sell" } | null>(null);
  const [qty, setQty] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [o, setO] = useState<MeltOrder | null>(null);
  const got = useRef(0);

  const load = useCallback(() => meltBoard().then(x => { setB(x); got.current = Date.now(); }).catch(e => setErr(ERR[(e as ApiError).code] || "اتصال برقرار نشد.")), []);
  // prices every 3 s while the page is in front
  useEffect(() => { load(); const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 3000); return () => clearInterval(t); }, [load]);
  // an order: its state every 2 s, the seconds counted down here
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef(0);
  useEffect(() => {
    if (!o || o.status !== "waiting") return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    const poll = setInterval(() => meltGet(o.id).then(r => { seen.current = Date.now(); setO(r.order); }).catch(() => {}), 2000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [o?.id, o?.status]);  // eslint-disable-line react-hooks/exhaustive-deps
  const left = o && o.status === "waiting" ? Math.max(0, o.left - Math.floor((now - (seen.current || o.created)) / 1000)) : 0;

  const price = pick ? (pick.side === "buy" ? pick.it.buy : pick.it.sell) : null;
  const live = pick && b?.items ? b.items.find(x => x.k === pick.it.k) : null, livePrice = live ? (pick!.side === "buy" ? live.buy : live.sell) : null;
  const ok = !!pick && qtyOk(qty, pick.it.dec) && !!livePrice;
  const total = ok && livePrice ? Math.round(livePrice * +qty) : 0;

  const send = async () => {
    if (!pick || !livePrice || !ok) return;
    setBusy(true); setErr("");
    try { const r = await meltOrder(pick.it.k, pick.side, qty, livePrice); seen.current = Date.now(); setO(r.order); setPick(null); setQty(""); }
    catch (e) {
      const x = e as ApiError;
      if (x.code === "price_changed") { await load(); setErr("قیمت همین الان عوض شد؛ قیمت تازه را ببینید و دوباره بزنید."); }
      else setErr(ERR[x.code] || "ثبت نشد؛ دوباره بزنید.");
    } finally { setBusy(false); }
  };
  const accept = async () => {
    if (!o?.changed) return; setBusy(true); setErr("");
    try { const r = await meltAccept(o.id, o.changed.unit); seen.current = Date.now(); setO(r.order); }
    catch (e) { const x = e as ApiError; if (x.extra?.order) setO(x.extra.order as MeltOrder); setErr(x.code === "price_changed" ? "قیمت دوباره عوض شد؛ قیمت تازه را ببینید." : ERR[x.code] || "ثبت نشد."); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    if (!o) return; setBusy(true);
    try { const r = await meltCancel(o.id); setO(r.order); } catch (e) { const x = e as ApiError; if (x.extra?.order) setO(x.extra.order as MeltOrder); }
    finally { setBusy(false); }
  };

  if (!b) return <section className="hs-sec"><p className="hs-prod-fine">{err || "در حال آوردن قیمت‌ها…"}</p></section>;
  if (!b.on) return <section className="hs-sec"><h1 className="hs-h">خرید و فروش آبشده</h1><p className="hs-prod-fine">این بخش الان بسته است.</p></section>;
  const items = b.items || [];
  return (
    <section className="hs-sec ml" aria-labelledby="hs-ml">
      <h1 className="hs-h" id="hs-ml">خرید و فروش آبشده</h1>
      {b.msg && <div className="ml-msg paper"><b>پیام مدیر</b><p>{faDigits(b.msg)}</p></div>}
      <p className="ml-at">{b.ok ? <>قیمت‌ها زنده‌اند · آخرین به‌روزرسانی <span className="num">{b.at ? new Date(b.at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</span></> : <span className="ml-bad">قیمت‌ها الان نمی‌آیند؛ خرید و فروش ممکن نیست.</span>}</p>

      {o ? (
        <div className="ml-wait paper" role="status" aria-live="polite">
          <p className="ml-what"><span className={"ml-side " + o.side}>{o.side === "buy" ? "خرید" : "فروش"}</span> {o.name} · <span className="num">{fa(o.qm / 1000, 3)}</span> {o.unitName}</p>
          {o.status === "waiting" ? <>
            {o.changed && <div className="ml-moved" role="alert"><b>قیمت تغییر کرد.</b> قیمت تازه: <span className="num">{toman(o.changed.unit)}</span> تومان · مبلغ کل: <b className="num">{toman(o.changed.total)}</b> تومان
              <button type="button" className="btn btn-gold" disabled={busy} onClick={accept}>قبول قیمت تازه</button></div>}
            {o.noPrice && <p className="ml-bad">قیمت الان نمی‌آید؛ تا برگردد، تایید ممکن نیست.</p>}
            <div className="hs-ring" style={{ "--p": left / (b.wait || 120) } as React.CSSProperties}><b className="num">{faDigits(left)}</b><small>ثانیه</small></div>
            <p className="hs-prod-fine">منتظر تایید لئون گلد. این صفحه را باز نگه دارید.</p>
            <p className="ml-sum">قیمت: <span className="num">{toman(o.unit)}</span> تومان · مبلغ کل: <b className="num">{toman(o.total)}</b> تومان</p>
            <button type="button" className="btn" disabled={busy} onClick={cancel}>لغو سفارش</button>
          </> : <>
            <p className={o.status === "done" ? "hs-ok" : "ml-bad"}>{o.status === "done" ? "✦ " + ST.done + " ✦" : ST[o.status] || o.status}</p>
            <p className="ml-sum">قیمت: <span className="num">{toman(o.unit)}</span> تومان · مبلغ کل: <b className="num">{toman(o.total)}</b> تومان</p>
            {o.status === "done" && <p className="hs-prod-fine">فاکتور این معامله فردا در حساب شما ثبت می‌شود.</p>}
            <button type="button" className="btn btn-gold" onClick={() => { setO(null); setErr(""); }}>معامله‌ی تازه</button>
          </>}
        </div>
      ) : pick ? (
        <div className="ml-form paper">
          <p className="ml-what"><span className={"ml-side " + pick.side}>{pick.side === "buy" ? "خرید" : "فروش"}</span> {pick.it.name}</p>
          <p className="ml-sum">قیمت هر {pick.it.unit}: <b className="num">{livePrice ? toman(livePrice) : "—"}</b> تومان{price && livePrice && price !== livePrice ? <span className="ml-bad"> (به‌روز شد)</span> : null}</p>
          <label className="hs-field"><span>مقدار ({pick.it.unit}{pick.it.dec ? "، تا ۳ رقم اعشار" : ""})</span>
            <input className="num" inputMode="decimal" autoComplete="off" value={qty} onChange={e => setQty(cleanQty(e.target.value))} placeholder={pick.it.dec ? "مثلاً ۲٫۵" : "مثلاً ۲"} autoFocus /></label>
          <p className="ml-total">مبلغ کل: <b className="num">{total ? toman(total) : "—"}</b> تومان</p>
          {err && <p className="hs-err" role="alert">{err}</p>}
          <div className="ml-btns">
            <button type="button" className="btn btn-gold" disabled={!ok || busy} onClick={send}>{busy ? "در حال ثبت…" : "ثبت سفارش"}</button>
            <button type="button" className="btn" onClick={() => { setPick(null); setQty(""); setErr(""); }}>انصراف</button>
          </div>
        </div>
      ) : null}

      {!o && !pick && err && <p className="hs-err" role="alert">{err}</p>}
      {!o && !pick && (b.groups || []).map(([g, t]) => {
        const L = items.filter(x => x.grp === g);
        if (!L.length) return null;
        return (
          <div className="ml-grp" key={g}>
            <h2>{t}</h2>
            {L.map(x => (
              <div className="ml-row paper" key={x.k}>
                <span className="ml-name">{x.name}</span>
                <button type="button" className="ml-p buy" disabled={!x.buy} onClick={() => { setPick({ it: x, side: "buy" }); setErr(""); }}>
                  <small>خرید</small><b className="num">{x.buy ? toman(x.buy) : "نداریم"}</b></button>
                <button type="button" className="ml-p sell" disabled={!x.sell} onClick={() => { setPick({ it: x, side: "sell" }); setErr(""); }}>
                  <small>فروش</small><b className="num">{x.sell ? toman(x.sell) : "نداریم"}</b></button>
              </div>
            ))}
          </div>
        );
      })}
      <p className="hs-prod-fine">قیمت‌ها به تومان و برای هر واحد است. هر سفارش ۱۲۰ ثانیه برای تایید لئون گلد صبر می‌کند؛ بعد از تایید، معامله قطعی است.</p>
    </section>
  );
}
