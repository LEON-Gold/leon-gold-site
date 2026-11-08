"use client";
// «حساب من»'s helpers for the customer: quick actions, today's union price, the year's purchases, one invoice in full
// (print / save as PDF, share), days left to an order's due date, the receipts they sent and whether Leon has recorded
// them, and the iPhone's «Add to Home Screen» hint. Nothing here writes to the ledger.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RULES, SHOP } from "@/lib/content";
import { usePrice, MITHQAL, toman as tomanOf } from "@/lib/price";
import { faDigits, gram, jdate, latin, myReceipts, photoUrl, toman, type Entry, type Line, type MyReceipt } from "@/lib/hesab";

// ---------- Persian calendar: day numbers, to count the days to a due date ----------
function jalCal(jy: number) {
  const br = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let leapJ = -14, jp = br[0], jump = 0, i = 1;
  for (; i < br.length; i++) { const jm = br[i]; jump = jm - jp; if (jy < jm) break; leapJ += ~~(jump / 33) * 8 + ~~((jump % 33) / 4); jp = jm; }
  const n = jy - jp; leapJ += ~~(n / 33) * 8 + ~~(((n % 33) + 3) / 4); if (jump % 33 === 4 && jump - n === 4) leapJ++;
  const gy = jy + 621, leapG = ~~(gy / 4) - ~~((~~(gy / 100) + 1) * 3 / 4) - 150;
  return { gy, march: 20 + leapJ - leapG };
}
const g2d = (gy: number, gm: number, gd: number) => { const d = ~~((gy + ~~((gm - 8) / 6) + 100100) * 1461 / 4) + ~~((153 * ((gm + 9) % 12) + 2) / 5) + gd - 34840408; return d - ~~(~~((gy + 100100 + ~~((gm - 8) / 6)) / 100) * 3 / 4) + 752; };
const j2d = (jy: number, jm: number, jd: number) => { const r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - ~~(jm / 7) * (jm - 7) + jd - 1; };
const dayOf = (s: string) => { const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(latin(s || "").trim()); return m ? j2d(+m[1], +m[2], +m[3]) : 0; };
const todayDay = () => { const n = new Date(); return g2d(n.getFullYear(), n.getMonth() + 1, n.getDate()); };

/** whole days from today to a Persian date; null when there is none */
export function daysLeft(due: string) { const d = dayOf(due); return d ? d - todayDay() : null; }
/** «۵ روز تا موعد», «امروز موعد است», or nothing when there is no date */
export function dueText(due: string) {
  const d = dayOf(due); if (!d) return "";
  const n = d - todayDay();
  return n > 1 ? `${faDigits(n)} روز تا موعد` : n === 1 ? "فردا موعد است" : n === 0 ? "امروز موعد است" : "";
}

// ---------- quick actions ----------
export function Quick({ customer }: { customer: boolean }) {
  return (
    <nav className="hs-quick" aria-label="کارهای سریع">
      <a href={SHOP.phoneHref}><Ico d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />تماس</a>
      <a href={SHOP.telegram} target="_blank" rel="noopener"><Ico d="M21 4 3 11l6 2 2 6 3-4 5 4zM9 13l9-7" />تلگرام</a>
      {customer && <button type="button" onClick={() => dispatchEvent(new Event("hs-receipt"))}><Ico d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />ارسال رسید</button>}
      {customer && <a href={SHOP.telegram} target="_blank" rel="noopener"><Ico d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />سفارش تازه</a>}
    </nav>
  );
}
const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;

// ---------- today's union price (the site's own feed); never applied to the balances, which stay in grams and rials ----------
export function PriceCard() {
  const { feed, failed } = usePrice();
  return (
    <section className="hs-price paper" id="hs-price" aria-label="قیمت امروز طلا">
      <div><small>هر گرم طلای ۱۸ عیار</small><b className="num">{feed ? tomanOf(feed.gp) : failed ? "—" : "…"}</b><span>تومان</span></div>
      <div><small>هر مثقال</small><b className="num">{feed ? tomanOf(feed.gp * MITHQAL) : failed ? "—" : "…"}</b><span>تومان</span></div>
      <p>{feed?.time ? `تابلوی اتحادیه، ساعت ${faDigits(feed.time)}` : "تابلوی اتحادیه‌ی طلا و جواهر تهران"} · <a href="../#price">محاسبه‌ی قیمت یک کار</a></p>
    </section>
  );
}

// ---------- this year's purchases, from the statement's own invoices ----------
const isSale = (e: Entry) => !!e.lines?.length && /^فاکتور/.test(e.label) && (e.gross ?? e.d) > 0;
export function Summary({ ent }: { ent: Entry[] }) {
  const s = useMemo(() => {
    const y = latin(jdate(new Date().toISOString())).slice(0, 4);
    const mine = ent.filter(e => isSale(e) && latin(e.date || jdate(e.ts)).startsWith(y));
    const last = ent.find(isSale);
    return { y, n: mine.length, g: mine.filter(e => e.u === "g").reduce((a, e) => a + (e.gross ?? e.d), 0), r: mine.filter(e => e.u === "r").reduce((a, e) => a + (e.gross ?? e.d), 0), last: last ? last.date || jdate(last.ts) : "" };
  }, [ent]);
  if (!s.n && !s.last) return null;
  return (
    <section className="hs-sum" aria-label={`خریدهای سال ${faDigits(s.y)}`}>
      <h2 className="hs-h">خریدهای سال {faDigits(s.y)}</h2>
      <dl>
        <div><dt>فاکتور</dt><dd className="num">{faDigits(s.n)}</dd></div>
        {s.r > 0 && <div><dt>خرید ریالی</dt><dd className="num">{toman(s.r)}<small> تومان</small></dd></div>}
        {s.g > 0 && <div><dt>خرید طلایی</dt><dd className="num">{gram(s.g)}<small> گرم</small></dd></div>}
        {s.last && <div><dt>آخرین خرید</dt><dd className="num">{faDigits(s.last)}</dd></div>}
      </dl>
    </section>
  );
}

// ---------- one invoice in full: print (or «Save as PDF» in the print sheet) and share ----------
const spec = (x: { qty: number; weight: number; carat: number }) => [x.qty > 1 ? faDigits(x.qty) + " عدد" : "", x.weight ? gram(x.weight) + " گرم" : "", x.carat ? "عیار " + faDigits(x.carat) : ""].filter(Boolean).join(" · ");
const lineAmt = (l: Line) => (l.amount ? toman(l.amount) + " تومان" : l.totalG ? gram(l.totalG) + " گرم ۷۵۰" : "");
export function InvoiceSheet({ e, name, onClose }: { e: Entry; name: string; onClose: () => void }) {
  useEffect(() => { const k = (x: KeyboardEvent) => { if (x.key === "Escape") onClose(); }; addEventListener("keydown", k); document.body.classList.add("hs-sheet-open");
    return () => { removeEventListener("keydown", k); document.body.classList.remove("hs-sheet-open"); }; }, [onClose]);
  const total = e.u === "g" ? gram(e.d) + " گرم ۷۵۰" : toman(e.d) + " تومان";
  const text = `${faDigits(e.label)} · ${faDigits(e.date || jdate(e.ts))}\n${name}\n` + (e.lines || []).map(l => `${l.ret ? "برگشتی: " : ""}${l.desc} — ${spec(l)}${lineAmt(l) ? " · " + lineAmt(l) : ""}`).join("\n") + `\nجمع: ${total}\nلئون گلد، ${SHOP.city}`;
  const share = async () => { try { if (navigator.share) await navigator.share({ title: faDigits(e.label), text }); else { await navigator.clipboard.writeText(text); alert("متن فاکتور کپی شد."); } } catch {} };
  return createPortal(
    <div className="hs-sheet-bg" onClick={x => { if (x.target === x.currentTarget) onClose(); }}>
      <article className="hs-inv paper" role="dialog" aria-modal="true" aria-label={faDigits(e.label)}>
        <header className="hs-inv-head">
          <div><p className="hs-inv-shop leaf">لئون گلد</p><p className="hs-inv-city">{SHOP.city} · {SHOP.phone}</p></div>
          <div className="hs-inv-no"><b>{faDigits(e.label)}</b><span className="num">{faDigits(e.date || jdate(e.ts))}</span></div>
        </header>
        <p className="hs-inv-to">برای: <b>{name}</b></p>
        <table className="hs-inv-t">
          <thead><tr><th>شرح</th><th>مشخصات</th><th>مبلغ</th></tr></thead>
          <tbody>{(e.lines || []).map((l, k) => <tr key={k} className={l.ret ? "ret" : ""}><td>{l.ret ? "برگشتی: " : ""}{l.desc || "—"}</td><td className="num">{spec(l)}</td><td className="num">{lineAmt(l)}</td></tr>)}</tbody>
          <tfoot><tr><td colSpan={2}>جمع فاکتور</td><td className="num">{total}</td></tr></tfoot>
        </table>
        <p className="hs-inv-note">گرم‌ها به عیار ۷۵۰ است. این نسخه از روی دفتر لئون گلد ساخته شده است.</p>
        <div className="hs-row hs-inv-act">
          <button type="button" className="btn btn-gold" onClick={() => print()}>ذخیره‌ی PDF یا چاپ</button>
          <button type="button" className="btn btn-ink" onClick={share}>اشتراک</button>
          <button type="button" className="hs-link" onClick={onClose}>بستن</button>
        </div>
      </article>
    </div>, document.body
  );
}

// ---------- the receipts this customer sent, and whether Leon has recorded each ----------
const SAMPLE_RECEIPTS: MyReceipt[] = [
  { id: "d1", blob: "", amount: 6500000, date: "۱۴۰۵/۰۷/۲۸", ts: Date.parse("2026-10-20T09:00:00Z"), status: "done" },
  { id: "d2", blob: "", amount: 3000000, date: "", ts: Date.parse("2026-10-30T09:00:00Z"), status: "pending" },
];
export function MyReceipts({ demo }: { demo?: boolean }) {
  const [list, setList] = useState<MyReceipt[] | null>(demo ? SAMPLE_RECEIPTS : null);
  const [shown, setShown] = useState<Record<string, string>>({});
  useEffect(() => {
    if (demo) return;
    let live = true;
    const load = () => myReceipts().then(r => { if (live) setList(r); }, () => { if (live) setList(null); });
    load(); addEventListener("hs-receipt-sent", load);
    return () => { live = false; removeEventListener("hs-receipt-sent", load); };
  }, [demo]);
  if (!list?.length) return null;
  const see = async (r: MyReceipt) => { if (shown[r.id]) return; try { const u = await photoUrl(r.blob); setShown(s => ({ ...s, [r.id]: u })); } catch {} };
  return (
    <section className="hs-sec" aria-labelledby="hs-rc">
      <div className="hs-sec-head"><h2 className="hs-h" id="hs-rc">رسیدهای فرستاده</h2><span className="hs-count">{faDigits(list.length)} رسید</span></div>
      <ul className="hs-list">
        {list.map(r => (
          <li key={r.id} className="hs-item paper hs-rc">
            <div className="hs-item-top"><b className="num">{r.amount != null ? toman(r.amount) + " تومان" : "مبلغ ننوشته"}</b>
              <span className={"hs-rc-st " + (r.status === "done" ? "done" : "")}>{r.status === "done" ? "در دفتر ثبت شد" : "در انتظار ثبت"}</span></div>
            <p className="hs-meta num">{r.date ? "واریز " + faDigits(r.date) + " · " : ""}فرستاده {jdate(new Date(r.ts).toISOString())}</p>
            {shown[r.id] ? <img className="hs-photo" src={shown[r.id]} alt="عکس رسید" /> : r.blob ? <button type="button" className="hs-link" onClick={() => see(r)}>دیدن عکس</button> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- the rules of buying and selling with Leon: a sheet opened from anywhere by openRules() ----------
export const openRules = () => dispatchEvent(new Event("hs-rules"));
export function Rules() {
  const [on, setOn] = useState(false);
  useEffect(() => { const o = () => setOn(true); addEventListener("hs-rules", o); return () => removeEventListener("hs-rules", o); }, []);
  useEffect(() => { if (!on) return; const k = (x: KeyboardEvent) => { if (x.key === "Escape") setOn(false); }; addEventListener("keydown", k); document.body.classList.add("hs-sheet-open");
    return () => { removeEventListener("keydown", k); document.body.classList.remove("hs-sheet-open"); }; }, [on]);
  if (!on) return null;
  return createPortal(
    <div className="hs-sheet-bg" onClick={x => { if (x.target === x.currentTarget) setOn(false); }}>
      <article className="hs-inv hs-rules paper" role="dialog" aria-modal="true" aria-labelledby="hs-rules-h">
        <header className="hs-inv-head"><div><p className="hs-inv-shop leaf">لئون گلد</p><h2 id="hs-rules-h" className="hs-rules-t">آیین‌نامه‌ی خرید و فروش کالا</h2></div></header>
        {RULES.map(r => (
          <section key={r.title} className="hs-rules-s">
            <h3>{r.title}</h3>
            {r.items && <ol>{r.items.map(t => <li key={t}>{t}</li>)}</ol>}
            {r.text && <p>{r.text}</p>}
          </section>
        ))}
        <div className="hs-row hs-inv-act"><button type="button" className="btn btn-gold" onClick={() => print()}>ذخیره‌ی PDF یا چاپ</button><button type="button" className="hs-link" onClick={() => setOn(false)}>بستن</button></div>
      </article>
    </div>, document.body);
}

// ---------- iPhone: keep «حساب من» on the home screen ----------
// opened in a phone's browser (not from the home-screen icon, never on a desktop): «حساب من» asks first to be added to the
// home screen, which it needs to work fully (notifications, staying signed in); once per visit it can be put off
export function HomeHint() {
  const [os, setOs] = useState<"" | "ios" | "android">("");
  useEffect(() => {
    const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), android = /Android/.test(ua);
    const standalone = matchMedia("(display-mode: standalone)").matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
    let later = false; try { later = !!sessionStorage.getItem("hs-a2hs-later"); } catch {}
    if (!standalone && !later && (ios || android)) setOs(ios ? "ios" : "android");
  }, []);
  useEffect(() => { if (!os) return; document.body.classList.add("hs-sheet-open"); return () => document.body.classList.remove("hs-sheet-open"); }, [os]);
  if (!os) return null;
  const later = () => { setOs(""); try { sessionStorage.setItem("hs-a2hs-later", "1"); } catch {} };
  return createPortal(
    <div className="hs-sheet-bg hs-a2hs-bg">
      <section className="hs-inv hs-a2hs paper" role="dialog" aria-modal="true" aria-labelledby="hs-a2hs-h">
        <h2 id="hs-a2hs-h" className="hs-a2hs-t">اول «حساب من» را به صفحه‌ی اصلی گوشی اضافه کنید</h2>
        <p className="hs-a2hs-p">«حساب من» از آیکن صفحه‌ی اصلی کامل کار می‌کند: اعلان‌ها می‌رسند، وارد می‌مانید و مثل یک برنامه باز می‌شود.</p>
        {os === "ios" ? <ol className="hs-steps-a2hs">
            <li>پایین صفحه در سافاری دکمه‌ی اشتراک <b aria-label="اشتراک">⬆︎</b> را بزنید.</li>
            <li>«افزودن به صفحه‌ی اصلی» (Add to Home Screen) را بزنید، بعد «افزودن».</li>
            <li>از آیکن تازه‌ی «حساب من» روی صفحه‌ی اصلی وارد شوید.</li>
          </ol>
          : <ol className="hs-steps-a2hs">
            <li>بالای صفحه در کروم منوی <b aria-label="منو">⋮</b> را بزنید.</li>
            <li>«افزودن به صفحه‌ی اصلی» یا «نصب برنامه» (Install app) را بزنید.</li>
            <li>از آیکن تازه‌ی «حساب من» روی صفحه‌ی اصلی وارد شوید.</li>
          </ol>}
        <button type="button" className="hs-link hs-a2hs-later" onClick={later}>فعلاً در مرورگر ادامه می‌دهم</button>
      </section>
    </div>, document.body);
}

