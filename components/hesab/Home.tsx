"use client";
// «حساب من» as an app: a tab bar at the bottom, and on the home tab the moments that matter to a customer first:
// their Leon membership card, the order on its way (photo, steps, days left), the balance (stamped «تسویه» with a
// small celebration when it is settled), and a quiet way to pay. The jewellery box shows every piece they bought;
// the statement is grouped by month with an icon for each kind of document and a line of the balance over time.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SHOP } from "@/lib/content";
import { faDigits, gram, jdate, latin, photoUrl, toman, type Account, type Entry, type Order, type VipStep } from "@/lib/hesab";
import { daysLeft } from "./Extras";

export type Tab = "home" | "vitrin" | "orders" | "box" | "stmt" | "profile" | "market";
const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const dateOf = (e: { date?: string; ts: string }) => latin(e.date || jdate(e.ts));

// ---------- a photo through this party's token; a gold leaf stands in while it loads or when there is none ----------
export function Pic({ id, className }: { id?: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let u = "", dead = false;
    photoUrl(id).then(r => { if (dead) return; u = r; setUrl(r); }).catch(() => {});
    return () => { dead = true; if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url ? <img className={className} src={url} alt="" /> : <span className={(className || "") + " hs-pic-none"} aria-hidden><img src="/leaf.webp" alt="" /></span>;
}

// ---------- the tab bar ----------
export const ICONS: Record<Tab, string> = {
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
  vitrin: "M3 9l2-5h14l2 5M3 9h18v11H3zM3 9l3 3 3-3 3 3 3-3 3 3 3-3",
  orders: "M5 7h14l-1 13H6zM9 7a3 3 0 0 1 6 0",
  box: "M4 9h16v11H4zM3 5h18v4H3zM12 5v15",
  stmt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  market: "M3 17l5-6 4 3 5-7 4 4M3 21h18",
};
export function TabBar({ tab, setTab, tabs }: { tab: Tab; setTab: (t: Tab) => void; tabs: [Tab, string, number?][] }) {
  return (
    <nav className="hs-tabs" aria-label="بخش‌ها">
      {tabs.map(([k, t, n]) => (
        <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICONS[k]} /></svg>
          {t}{n ? <b className="hs-tab-n">{faDigits(n)}</b> : null}
        </button>
      ))}
    </nav>
  );
}

// ---------- the membership card: a vault plate with the customer's name in gold leaf, and since when; a VIP
// (the owner marks one on its ledger card) gets the onyx-and-gold card with «VIP» on it ----------
export function MemberCard({ a, flip }: { a: Account; flip?: boolean }) {
  const first = a.ent.length ? a.ent[a.ent.length - 1] : null; // the statement comes newest first
  const since = first ? dateOf(first).slice(0, 4) : "";
  const way = a.vipWay;
  if (flip && !a.vip && way && !way.is && way.steps?.length) return <VipWayCard a={a} since={since} steps={way.steps} all={!!way.all} />;
  return (
    <section className={"hs-card" + (a.vip ? " vip" : "")} aria-label={a.vip ? "کارت VIP لئون گلد" : "کارت مشتری لئون گلد"}>
      <CardFace a={a} since={since} />
    </section>
  );
}
function CardFace({ a, since }: { a: Account; since: string }) {
  return <>
    <span className="hs-card-rose" aria-hidden />
    <span className="hs-card-top"><img src="/leaf.webp" alt="" width={22} height={40} /><span lang="en" dir="ltr">{a.vip ? "LEON GOLD · PRIVÉ" : "LEON GOLD · MEMBER"}</span></span>
    {a.vip && <b className="hs-card-vip" lang="en" dir="ltr">VIP</b>}
    <span className="hs-card-name leaf">{a.name}</span>
    <span className="hs-card-foot">
      <span>{a.vip ? (since ? `مشتری ویژه‌ی لئون گلد از ${faDigits(since)}` : "مشتری ویژه‌ی لئون گلد") : since ? `مشتری لئون گلد از ${faDigits(since)}` : "مشتری لئون گلد"}</span>
      <span className="num" dir="ltr">№ {a.id.slice(-6).toUpperCase()}</span>
    </span>
  </>;
}

// ---------- reminders (owner, 2026-11-14): a password the owner made, and details not complete; each opens its place in
// «پروفایل من». They stay until done. ----------
export function Reminders({ pass, missing, onPass, onInfo }: { pass: boolean; missing: string[]; onPass: () => void; onInfo: () => void }) {
  if (!pass && !missing.length) return null;
  return (
    <section className="hs-remind paper" aria-labelledby="hs-remind-h">
      <h2 className="hs-remind-h" id="hs-remind-h"><svg viewBox="0 0 24 24" aria-hidden><path d="M6 9a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6M10 19a2 2 0 0 0 4 0" /></svg>یادآوری</h2>
      {pass && <div className="hs-remind-it"><p><b>رمز خودتان را بگذارید</b><span>رمز ورود شما را لئون گلد ساخته؛ برای امنیت حساب، رمز تازه‌ای بگذارید که فقط خودتان بدانید.</span></p>
        <button type="button" className="btn btn-gold" onClick={onPass}>تغییر رمز</button></div>}
      {missing.length > 0 && <div className="hs-remind-it"><p><b>اطلاعات خود را کامل کنید</b><span>هنوز ثبت نشده: {missing.join("، ")}</span></p>
        <button type="button" className={"btn " + (pass ? "btn-line" : "btn-gold")} onClick={onInfo}>تکمیل اطلاعات</button></div>}
    </section>
  );
}

// ---------- the way to VIP (owner, 2026-11-13, .briefs/vip-card.md): a member who is not VIP is invited to tap its card;
// the card turns over and its back shows the three steps (each ticked or not, with how far along it is) and what a VIP
// gets. The words are the owner's own; nothing is added. VIP itself stays the owner's mark in the ledger. ----------
const VIP_STEP: Record<VipStep["k"], string> = {
  settle: "تسویه‌ی نقدی ۴ بار",
  grams: "حد نصاب سفارش: حداقل ۴۰۰ گرم (جمع کل فاکتورها)",
  invite: "دعوت ۳ نفر به لئون گلد، با تأیید سفارش اولشان",
};
const VIP_GETS = ["۰٫۲٪ تخفیف روی هر فاکتور", "اجناس تست اول با فی نقدی", "تسویه‌ی ۲ تا ۳ هفته‌ای", "تحویل کار در سریع‌ترین زمان", "مشاوره‌ی خرید با کیفیت از طرف تیم لئون گلد"];
const stepHave = (s: VipStep) => s.k === "grams" ? `${gram(Math.min(s.have, s.need))} از ${faDigits(s.need)} گرم` : `${faDigits(Math.min(s.have, s.need))} از ${faDigits(s.need)}`;
function VipWayCard({ a, since, steps, all }: { a: Account; since: string; steps: VipStep[]; all: boolean }) {
  const [back, setBack] = useState(false), [seen, setSeen] = useState(false);
  const [h, setH] = useState<number | null>(null);
  const front = useRef<HTMLButtonElement>(null), rear = useRef<HTMLDivElement>(null), turnBack = useRef<HTMLButtonElement>(null);
  const done = steps.filter(s => s.done).length;
  // the card grows to its back's height when turned (the back holds more than the front)
  useLayoutEffect(() => {
    const el = back ? rear.current : front.current; if (!el) return;
    const set = () => setH(el.offsetHeight); set();
    const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect();
  }, [back]);
  const turn = (to: boolean) => { setBack(to); setSeen(true); requestAnimationFrame(() => (to ? turnBack.current : front.current)?.focus({ preventScroll: true })); };
  return (
    <div className="hs-flipwrap">
    <section className={"hs-flip" + (back ? " is-back" : "") + (seen ? " seen" : "")} style={h ? { height: h } : undefined} aria-label="کارت مشتری لئون گلد و راه VIP شدن">
      <div className="hs-flip-in">
        <button ref={front} type="button" className="hs-card hs-flip-front" inert={back} aria-hidden={back} aria-expanded={back} aria-controls="hs-vipway"
          onClick={() => turn(true)} aria-label={`کارت مشتری لئون گلد، ${a.name}. برای دیدن راه VIP شدن بزنید.`}>
          <CardFace a={a} since={since} />
        </button>
        <div ref={rear} id="hs-vipway" className="hs-card hs-flip-back" inert={!back} aria-hidden={!back} onClick={e => { if (!(e.target as HTMLElement).closest("button")) turn(false); }}>
          <span className="hs-card-rose" aria-hidden />
          <span className="hs-vw-head"><b>راه VIP شدن</b><small className="num">{faDigits(done)} از {faDigits(steps.length)} انجام شده</small></span>
          <ol className="hs-vw-steps">
            {steps.map(s => (
              <li key={s.k} className={s.done ? "done" : ""}>
                <i aria-hidden>{s.done ? "✓" : ""}</i>
                <span>{VIP_STEP[s.k]}<small className="num">{s.done ? "انجام شده · " : ""}{stepHave(s)}</small>
                  <span className="hs-vw-bar" aria-hidden><span style={{ width: `${Math.min(100, s.need ? s.have / s.need * 100 : 0)}%` }} /></span></span>
                <span className="hs-sr">{s.done ? "انجام شده" : "هنوز انجام نشده"}</span>
              </li>
            ))}
          </ol>
          {all && <p className="hs-vw-all" role="status">هر سه شرط انجام شده؛ به لئون گلد خبر داده شد.</p>}
          <p className="hs-vw-gets-h">بعد از VIP شدن:</p>
          <ul className="hs-vw-gets">{VIP_GETS.map(g => <li key={g}>{g}</li>)}</ul>
          <button ref={turnBack} type="button" className="hs-vw-turn" onClick={() => turn(false)}>برگرداندن کارت</button>
        </div>
      </div>
    </section>
    {!back && <p className="hs-flip-hint" aria-hidden onClick={() => turn(true)}><i />روی کارت خود بزنید</p>}
    </div>
  );
}

// ---------- the order on its way: its photo, the steps it has passed, and a ring of the days left ----------
const STEP = ["new", "src", "ready", "done"], STEP_T = ["ثبت شد", "در حال تهیه", "آماده‌ی تحویل", "تحویل شد"];
const dayN = (s: string) => { const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(latin(s || "").trim()); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : 0; }; // a Persian date as a rough day count, for proportions only
export function Journey({ o }: { o: Order }) {
  const at = Math.max(0, STEP.indexOf(o.status)), ready = o.status === "ready";
  const photo = o.items.find(i => i.photo)?.photo;
  const total = dayN(o.due) - dayN(o.date), left = daysLeft(o.due);
  const passed = total > 0 && left != null ? Math.min(1, Math.max(0, 1 - left / total)) : at / 3;
  return (
    <article className={"hs-trip paper" + (ready ? " is-ready" : "")} aria-label="سفارش در راه">
      {ready && <p className="hs-trip-ready">✦ آماده‌ی تحویل است؛ هر وقت خواستید سر بزنید ✦</p>}
      <div className="hs-trip-main">
        <Pic id={photo} className="hs-trip-pic" />
        <div className="hs-trip-txt">
          <p className="hs-trip-k">سفارش شما · <span className="num" dir="ltr">#{o.ref}</span></p>
          <h3>{o.items.map(i => i.desc).filter(Boolean).join("، ") || "سفارش"}</h3>
          <p className="hs-trip-s">{STEP_T[at]}{o.due ? " · موعد " + faDigits(o.due) : ""}</p>
        </div>
        {o.due && !ready && (
          <div className="hs-ring" role="img" aria-label={left == null ? "موعد" : left >= 0 ? faDigits(left) + " روز تا موعد" : "موعد گذشته"}>
            <svg viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="19" /><circle cx="22" cy="22" r="19" className="on" style={{ strokeDashoffset: 119.4 * (1 - passed) }} /></svg>
            <b className="num">{left != null && left >= 0 ? faDigits(left) : "!"}</b><small>{left != null && left >= 0 ? "روز" : "گذشته"}</small>
          </div>
        )}
      </div>
      <ol className="hs-trip-steps" aria-label="مرحله‌ها">{STEP_T.map((t, i) => <li key={t} className={i < at ? "past" : i === at ? "now" : ""}><i aria-hidden />{t}</li>)}</ol>
    </article>
  );
}

// ---------- settled: a gold seal pressed onto the page, once ----------
export function Seal() {
  return <div className="hs-seal" role="status"><span>تسویه</span><small>حساب شما با لئون صاف است</small></div>;
}

// ---------- a quiet way to pay what is owed: the shop's card number to copy, then the receipt ----------
const group = (s: string, n: number) => s.replace(new RegExp(`(.{${n}})(?=.)`, "g"), "$1 ");
export function PayCard({ a }: { a: Account }) {
  const [copied, setCopied] = useState("");
  if (!(a.bal.r > 0.5)) return null;
  const copy = async (k: string, v: string) => { try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 2000); } catch {} };
  return (
    <section className="hs-pay paper" id="hs-pay" aria-label="پرداخت">
      <p className="hs-pay-k">مانده‌ی پرداخت</p>
      <p className="hs-pay-v num">{toman(a.bal.r)} <small>تومان</small></p>
      <p className="hs-pay-how">به یکی از این حساب‌ها واریز کنید، بعد رسیدش را بفرستید:</p>
      {SHOP.cards.map(c => (
        <div key={c.card} className="hs-bank">
          <p className="hs-bank-t"><b>بانک {c.bank}</b><span>به نام {c.name}</span></p>
          <div className="hs-bank-row"><span className="num" dir="ltr">{faDigits(group(c.card, 4))}</span><button type="button" onClick={() => copy(c.card, c.card)}>{copied === c.card ? "کپی شد ✓" : "کپی کارت"}</button></div>
          <div className="hs-bank-row sh"><span className="num" dir="ltr">{faDigits(group(c.sheba, 4))}</span><button type="button" onClick={() => copy(c.sheba, c.sheba)}>{copied === c.sheba ? "کپی شد ✓" : "کپی شبا"}</button></div>
        </div>
      ))}
      <button type="button" className="btn btn-gold" onClick={() => dispatchEvent(new Event("hs-receipt"))}>واریز کردم؛ ارسال رسید</button>
    </section>
  );
}

// ---------- the jewellery box: every piece bought from Leon, newest first ----------
type Piece = { desc: string; weight: number; carat: number; date: string; photo?: string };
export function JewelBox({ a }: { a: Account }) {
  const pieces = useMemo(() => {
    const out: Piece[] = [];
    for (const e of a.ent) if (e.lines?.length && /^فاکتور/.test(e.label) && (e.gross ?? e.d) > 0) for (const l of e.lines) if (!l.ret && l.desc) out.push({ desc: l.desc, weight: l.weight, carat: l.carat, date: dateOf(e), photo: l.photo });
    return out;
  }, [a.ent]);
  const grams = pieces.reduce((s, p) => s + (p.weight || 0), 0);
  return (
    <section className="hs-sec" aria-labelledby="hs-box">
      <div className="hs-box-head">
        <h2 className="hs-h" id="hs-box">صندوقچه‌ی جواهرات من</h2>
        <p>{pieces.length ? `${faDigits(pieces.length)} کار از لئون گلد${grams ? "، روی هم " + gram(grams) + " گرم" : ""}` : "هر کاری که از لئون بخرید، اینجا کنار بقیه می‌نشیند."}</p>
      </div>
      {pieces.length > 0 && (
        <ul className="hs-box">
          {pieces.map((p, i) => (
            <li key={i} className="hs-box-it paper">
              <Pic id={p.photo} className="hs-box-pic" />
              <b>{p.desc}</b>
              <span className="num">{[p.weight ? gram(p.weight) + " گرم" : "", p.carat ? "عیار " + faDigits(p.carat) : ""].filter(Boolean).join(" · ")}</span>
              <small className="num">{faDigits(p.date)}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- the statement by month, with an icon per kind of document and the balance over time ----------
const kindOf = (e: Entry) => /^فاکتور|عمده/.test(e.label) && e.lines?.length ? (e.lines.every(l => l.ret) ? "ret" : "inv") : /^دریافت/.test(e.label) ? "in" : /^پرداخت/.test(e.label) ? "out" : "doc";
const KIND_ICON: Record<string, string> = { inv: "M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0", ret: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3", in: "M12 4v12M6 11l6 6 6-6M5 20h14", out: "M12 20V8M6 13l6-6 6 6M5 4h14", doc: "M6 3h9l3 3v15H6zM9 11h6M9 15h6" };
export function Spark({ ent, u }: { ent: Entry[]; u: "g" | "r" }) {
  const pts = ent.filter(e => e.u === u).slice().reverse().map(e => e.run);
  if (pts.length < 2) return null;
  const lo = Math.min(0, ...pts), hi = Math.max(0, ...pts), span = hi - lo || 1;
  const xy = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${40 - ((v - lo) / span) * 36 - 2}`).join(" ");
  const zero = 40 - ((0 - lo) / span) * 36 - 2;
  return (
    <figure className="hs-spark" aria-label={u === "r" ? "روند مانده‌ی ریالی" : "روند مانده‌ی طلایی"}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden><line x1="0" x2="100" y1={zero} y2={zero} className="z" /><polyline points={xy} /></svg>
      <figcaption>{u === "r" ? "مانده‌ی ریالی در طول زمان" : "مانده‌ی طلایی در طول زمان"} · خط نازک یعنی تسویه</figcaption>
    </figure>
  );
}
export function monthGroups(rows: Entry[]) {
  const g: { key: string; title: string; rows: Entry[] }[] = [];
  for (const e of rows) {
    const [y, m] = dateOf(e).split("/"), key = y + "/" + m;
    let cur = g[g.length - 1];
    if (!cur || cur.key !== key) { cur = { key, title: (MONTHS[+m - 1] || "") + " " + faDigits(y || ""), rows: [] }; g.push(cur); }
    cur.rows.push(e);
  }
  return g;
}
export const EntryIcon = ({ e }: { e: Entry }) => <i className={"hs-st-ic " + kindOf(e)} aria-hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={KIND_ICON[kindOf(e)]} /></svg></i>;
