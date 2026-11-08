"use client";
// «حساب من»'s hamburger menu (every section, grouped) and the profile page: the party's own details as the ledger has
// them, and the username and password they sign in with, which they can change here with their current password.
import { InfoForm } from "./Onboard";
import { useEffect, useRef, useState } from "react";
import { SHOP } from "@/lib/content";
import { ApiError, changeLogin, faDigits, gram, jdate, jtime, rial, side, type Account, type Me } from "@/lib/hesab";
import { openRules } from "./Extras";
import { MemberCard, type Tab } from "./Home";
import { Notify } from "./Notify";

export const KIND: Record<Account["kind"], string> = { customer: "مشتری", supplier: "تأمین‌کننده", both: "مشتری و تأمین‌کننده" };
const initial = (s: string) => (s.trim().replace(/^(آقای|خانم|جناب)\s+/, "")[0] || "ل");

const P: Record<string, string> = {
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
  vitrin: "M3 9l2-5h14l2 5M3 9h18v11H3zM3 9l3 3 3-3 3 3 3-3 3 3 3-3",
  orders: "M5 7h14l-1 13H6zM9 7a3 3 0 0 1 6 0",
  box: "M4 9h16v11H4zM3 5h18v4H3zM12 5v15",
  stmt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  receipt: "M12 16V4M7 9l5-5 5 5M4 20h16",
  price: "M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8",
  rules: "M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6",
  tg: "M21 4 3 11l6 2 2 6 3-4 5 4zM9 13l9-7",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  site: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  reload: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
};
const Ico = ({ k }: { k: string }) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={P[k]} /></svg>;

// the round initial in the header; opens the profile
export function Avatar({ name, onClick, current }: { name: string; onClick: () => void; current: boolean }) {
  return <button type="button" className="hs-ava" onClick={onClick} aria-label="پروفایل من" aria-current={current ? "page" : undefined}>{initial(name)}</button>;
}

type Go = (t: Tab, id?: string) => void;
type Item = { k: string; t: string; n?: number; on?: boolean; go?: () => void; href?: string; ext?: boolean };

export function Menu({ open, onClose, a, data, tab, go, onReload, onOut }: {
  open: boolean; onClose: () => void; a: Account; data: Me; tab: Tab; go: Go; onReload?: () => void; onOut: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("button, a")?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", key); document.documentElement.classList.add("hs-locked");
    return () => { removeEventListener("keydown", key); document.documentElement.classList.remove("hs-locked"); back?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;

  const isCustomer = a.kind !== "supplier", isSupplier = a.kind !== "customer" || a.work.length > 0;
  const openOrders = a.orders.filter(o => o.status !== "done" && o.status !== "cancel").length;
  const tabItem = (k: Tab, t: string, n?: number): Item => ({ k, t, n, on: tab === k, go: () => go(k) });
  const groups: [string, Item[]][] = [
    ["حساب من", [tabItem("home", "خانه"), tabItem("stmt", "صورتحساب و فاکتورها"), ...(isCustomer ? [tabItem("box", "صندوقچه‌ی جواهرات")] : []), { k: "bell", t: "اعلان‌ها", go: () => go("profile", "hs-notify") }]],
    ["خرید و سفارش", [
      ...(isCustomer ? [tabItem("vitrin", "ویترین لئون گلد"), tabItem("orders", "سفارش‌های من", openOrders)] : []),
      ...(isSupplier ? [{ ...tabItem("orders", "کارهای سپرده به من", a.work.length), k: "orders" }] : []),
    ].filter((x, i, l) => l.findIndex(y => y.t === x.t) === i)],
    ...(isCustomer ? [["پرداخت", [
      { k: "card", t: "شماره کارت‌های لئون گلد", go: () => go("home", "hs-pay") },
      { k: "receipt", t: "ارسال رسید کارت‌به‌کارت", go: () => { go("home"); setTimeout(() => dispatchEvent(new Event("hs-receipt")), 80); } },
    ]] as [string, Item[]]] : []),
    ["لئون گلد", [
      { k: "price", t: "قیمت امروز طلا", go: () => go("home", "hs-price") },
      { k: "rules", t: "آیین‌نامه‌ی خرید و فروش", go: () => { onClose(); openRules(); } },
      { k: "tg", t: "پیام در تلگرام", href: SHOP.telegram, ext: true },
      { k: "phone", t: "تماس با فروشگاه", href: SHOP.phoneHref },
      { k: "site", t: "صفحه‌ی اصلی سایت", href: "../" },
    ]],
  ];
  const row = (it: Item) => {
    const inner = <><Ico k={it.k} /><span>{it.t}</span>{it.n ? <b className="hs-tab-n hs-menu-n">{faDigits(it.n)}</b> : null}</>;
    return <li key={it.t}>{it.href
      ? <a href={it.href} {...(it.ext ? { target: "_blank", rel: "noopener" } : {})} onClick={onClose}>{inner}</a>
      : <button type="button" aria-current={it.on ? "page" : undefined} onClick={it.go}>{inner}</button>}</li>;
  };

  return (
    <div className="hs-menu-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hs-menu" role="dialog" aria-modal="true" aria-label="منوی حساب من" ref={panel}>
        <div className="hs-menu-top">
          <button type="button" className="hs-menu-x" onClick={onClose} aria-label="بستن منو">✕</button>
          <button type="button" className="hs-menu-me" onClick={() => go("profile")} aria-current={tab === "profile" ? "page" : undefined}>
            <span className="hs-ava big" aria-hidden>{initial(a.name)}</span>
            <span className="hs-menu-who"><b>{a.name}</b><small>{data.username ? <bdi dir="ltr">{data.username}</bdi> : KIND[a.kind]}</small></span>
            <span className="hs-menu-go">پروفایل ‹</span>
          </button>
        </div>
        <nav className="hs-menu-nav" aria-label="بخش‌ها">
          {groups.filter(g => g[1].length).map(([h, items]) => (
            <section key={h}><h2>{h}</h2><ul>{items.map(row)}</ul></section>
          ))}
        </nav>
        <div className="hs-menu-foot">
          {onReload && <button type="button" onClick={() => { onClose(); onReload(); }}><Ico k="reload" />تازه کردن</button>}
          <button type="button" className="hs-menu-out" onClick={onOut}><Ico k="out" />{data.demo ? "بستن نمونه" : "خروج از حساب"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- the profile: who they are in Leon's ledger, and their sign-in ----------
const ERR: Record<string, string> = {
  bad_old: "رمز فعلی درست نیست.",
  bad_password: "رمز تازه باید دست‌کم ۶ حرف یا رقم باشد.",
  bad_username: "نام کاربری باید ۳ تا ۴۰ حرف انگلیسی یا رقم باشد (نقطه، خط تیره و _ هم مجاز است) و با حرف یا رقم شروع شود.",
  username_taken: "این نام کاربری را کس دیگری دارد. نام دیگری انتخاب کنید.",
  nothing: "چیزی عوض نشده است.",
  too_many: "چند بار پشت سر هم رمز اشتباه زده شد. ربع ساعت دیگر دوباره امتحان کنید.",
  offline: "به سرور وصل نشدیم. اینترنت را بررسی کنید و دوباره بزنید.",
  login: "ورودتان تمام شده. دوباره وارد شوید.",
};
const errText = (e: unknown) => (e instanceof ApiError && ERR[e.code]) || "مشکلی پیش آمد. دوباره امتحان کنید.";

export function Profile({ a, data, onUsername }: { a: Account; data: Me; onUsername: (u: string) => void }) {
  const g = side(a.bal.g, "g"), r = side(a.bal.r, "r");
  const balText = (v: number, u: "g" | "r", s: string) => s === "z" ? "تسویه" : (u === "g" ? gram(v) + " گرم" : rial(v) + " ریال") + (s === "dr" ? " بدهکار" : " بستانکار");
  return (
    <section className="hs-sec hs-prof" aria-labelledby="hs-prof">
      <h1 className="hs-h" id="hs-prof">پروفایل من</h1>
      {a.kind !== "supplier" && <MemberCard a={a} />}
      <dl className="hs-prof-dl paper">
        <div><dt>نام در دفتر لئون</dt><dd>{a.name}</dd></div>
        {a.shop && <div><dt>فروشگاه</dt><dd>{a.shop}</dd></div>}
        <div><dt>نوع حساب</dt><dd>{KIND[a.kind]}</dd></div>
        {a.phone && <div><dt>موبایل</dt><dd className="num" dir="ltr">{faDigits(a.phone)}</dd></div>}
        <div><dt>شماره‌ی حساب</dt><dd className="num" dir="ltr">№ {a.id.slice(-6).toUpperCase()}</dd></div>
        <div><dt>حساب طلایی</dt><dd className="num">{balText(a.bal.g, "g", g)}</dd></div>
        <div><dt>حساب ریالی</dt><dd className="num">{balText(a.bal.r, "r", r)}</dd></div>
        {data.updated && <div><dt>آخرین ثبت در دفتر</dt><dd className="num">{jdate(data.updated)}، ساعت {jtime(data.updated)}</dd></div>}
      </dl>
      <p className="hs-prof-fine">نام، فروشگاه و شماره‌ی موبایل را لئون گلد در دفتر ثبت می‌کند. اگر چیزی درست نیست، <a href={SHOP.telegram} target="_blank" rel="noopener">در تلگرام بگویید</a>.</p>
      {data.demo ? <Login username="demo.user" demo onUsername={() => {}} />
        : data.username ? <Login username={data.username} onUsername={onUsername} />
        : <p className="hs-prof-fine">شما با لینک یک‌باره وارد شده‌اید. برای داشتن نام کاربری و رمز، از لئون گلد بخواهید.</p>}
      <section className="hs-login paper" aria-labelledby="hs-info-h">
        <h2 className="hs-h" id="hs-info-h">اطلاعات من</h2>
        <p className="hs-prof-fine">پر کردن هیچ‌کدام اجباری نیست. لئون گلد این‌ها را می‌بیند؛ حساب شما در دفتر با آن عوض نمی‌شود.</p>
        <InfoForm a={a} info={data.info} demo={data.demo} onSaved={() => {}} />
      </section>
      <Notify demo={data.demo} />
    </section>
  );
}

function Login({ username, demo, onUsername }: { username: string; demo?: boolean; onUsername: (u: string) => void }) {
  const [what, setWhat] = useState<"" | "user" | "pass">("");
  const [un, setUn] = useState(username);
  const [old, setOld] = useState("");
  const [nu, setNu] = useState("");
  const [nu2, setNu2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => { setWhat(""); setOld(""); setNu(""); setNu2(""); setUn(username); };
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    if (!old) return setMsg({ ok: false, t: "رمز فعلی را بنویسید." });
    if (what === "pass" && nu !== nu2) return setMsg({ ok: false, t: "رمز تازه و تکرارش یکی نیستند." });
    if (demo) { setMsg({ ok: true, t: "در حساب نمونه چیزی ذخیره نمی‌شود." }); close(); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await changeLogin(old, what === "user" ? { username: un.trim() } : { password: nu });
      if (what === "user") { onUsername(r.username); setMsg({ ok: true, t: "نام کاربری عوض شد. از این به بعد با «" + r.username + "» وارد شوید." }); }
      else setMsg({ ok: true, t: "رمز عوض شد. از این به بعد با رمز تازه وارد شوید؛ دستگاه‌های دیگرتان از حساب خارج شدند." });
      setWhat(""); setOld(""); setNu(""); setNu2("");
    } catch (x) { setMsg({ ok: false, t: errText(x) }); }
    finally { setBusy(false); }
  };
  return (
    <section className="hs-login paper" aria-labelledby="hs-login">
      <h2 className="hs-h" id="hs-login">ورود به حساب</h2>
      <div className="hs-login-row"><span>نام کاربری</span><b dir="ltr">{username}</b>
        {what !== "user" && <button type="button" className="hs-link" onClick={() => { close(); setMsg(null); setWhat("user"); }}>تغییر</button>}</div>
      <div className="hs-login-row"><span>رمز</span><b aria-label="پنهان">••••••</b>
        {what !== "pass" && <button type="button" className="hs-link" onClick={() => { close(); setMsg(null); setWhat("pass"); }}>تغییر</button>}</div>
      {what && (
        <form className="hs-pass" onSubmit={send} noValidate>
          {what === "user" ? (
            <label className="hs-field"><span>نام کاربری تازه (حروف انگلیسی یا رقم)</span>
              <input value={un} onChange={e => setUn(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" maxLength={40} /></label>
          ) : <>
            <label className="hs-field"><span>رمز تازه (دست‌کم ۶ حرف یا رقم)</span><input type="password" value={nu} onChange={e => setNu(e.target.value)} autoComplete="new-password" dir="ltr" /></label>
            <label className="hs-field"><span>تکرار رمز تازه</span><input type="password" value={nu2} onChange={e => setNu2(e.target.value)} autoComplete="new-password" dir="ltr" /></label>
          </>}
          <label className="hs-field"><span>رمز فعلی (برای تأیید)</span><input type="password" value={old} onChange={e => setOld(e.target.value)} autoComplete="current-password" dir="ltr" /></label>
          {msg && !msg.ok && <p className="hs-err" role="alert">{msg.t}</p>}
          <div className="hs-row"><button className="btn btn-gold" disabled={busy}>{busy ? "در حال ذخیره…" : what === "user" ? "ذخیره‌ی نام کاربری" : "ذخیره‌ی رمز تازه"}</button>
            <button type="button" className="hs-link" onClick={() => { close(); setMsg(null); }}>انصراف</button></div>
        </form>
      )}
      {msg?.ok && <p className="hs-ok" role="status">{msg.t}</p>}
    </section>
  );
}
