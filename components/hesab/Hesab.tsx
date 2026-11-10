"use client";
// «حساب من»: sign-in (the username and password Leon gave the party, or the owner's one-time link), then the party's
// assay slip (gold and rial balance), their orders (customers), the work given to them (suppliers) and the statement, newest first.
import { useCallback, useEffect, useMemo, useState } from "react";
import { SHOP } from "@/lib/content";
import Door from "@/components/Door";
import { LedgerInvoice } from "./Invoice";
import { chrono, monthTitle, num, sideWord, statementPdf, totals } from "./Report";
import { Onboard, useSigned } from "./Onboard";
import { setRulesGroup } from "@/lib/content";
import AuthSwap from "./AuthSwap";
import Market, { MarketCard } from "./Market";
import { ICONS } from "./Home";
import ThemeToggle from "@/components/ThemeToggle";
import { HomeHint, InvoiceSheet, MyReceipts, PriceCard, Quick, Rules, Summary, dueText, openRules } from "./Extras";
import { EntryIcon, JewelBox, Journey, MemberCard, PayCard, Seal, TabBar, type Tab } from "./Home";
import Vitrin from "./Vitrin";
import { Avatar, KIND, Menu, Profile } from "./Menu";
import { dropDevice, useHomeApp } from "./Notify";
import {
  ApiError, SAMPLE, signup, refFromLink, publicBiz, nidOk, dayNum, faDigits, getToken, gram, jdate, jtime, latin, login, logout, me, photoUrl, redeem, rial, sendReceipt, shrinkPhoto, side, today, toman,
  type Account, type BizType, type Entry, type Me,
} from "@/lib/hesab";

type Phase = "boot" | "form" | "in";
const ERR: Record<string, string> = {
  bad_login: "نام کاربری یا رمز درست نیست.",
  portal_off: "«حساب من» برای این حساب فعلاً بسته است. در تلگرام با لئون گلد در تماس باشید.",
  too_many: "چند بار پشت سر هم اشتباه شد. ربع ساعت دیگر دوباره امتحان کنید.",
  offline: "به سرور وصل نشدیم. اینترنت را بررسی کنید و دوباره بزنید.",
  no_account: "این حساب در دفتر لئون گلد پیدا نشد. در تلگرام به ما خبر بدهید.",
  login: "ورودتان تمام شده. دوباره وارد شوید.",
  bad_old: "رمز فعلی درست نیست.",
  bad_password: "رمز تازه باید دست‌کم ۶ حرف یا رقم باشد.",
  bad_type: "این فایل عکس نیست. یک عکس از رسید را انتخاب کن.",
  too_large: "عکس خیلی بزرگ است. عکس کوچک‌تری انتخاب کن یا دوباره از دوربین بگیر.",
  signup_pending: "ثبت‌نام شما رسیده و منتظر تایید لئون گلد است. بعد از تایید با همین نام کاربری و رمز وارد شوید.",
  signup_rejected: "ثبت‌نام شما تایید نشد. برای پیگیری در تلگرام با لئون گلد در تماس باشید.",
  signup_waiting: "با این شماره موبایل یک ثبت‌نام منتظر تایید هست. لطفاً منتظر بمانید.",
  username_taken: "این نام کاربری را کس دیگری گرفته. یک نام دیگر انتخاب کنید.",
  bad_username: "نام کاربری باید با حروف انگلیسی یا عدد باشد، ۳ تا ۴۰ حرف (نقطه، خط تیره و زیرخط هم مجاز است).",
  bad_mobile: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.",
  bad_name: "نام و نام خانوادگی را کامل بنویسید.",
  bad_birth: "تاریخ تولد را مثل ۱۳۷۰/۰۵/۱۲ بنویسید.",
  bad_ref: "کد معرف درست نیست. آن را دوباره از کسی که دعوتتان کرده بگیرید، یا خالی بگذارید.",
  bad_nid: "کد ملی درست نیست. ۱۰ رقم کد ملی را بنویسید.",
  nid_taken: "با این کد ملی قبلاً حساب ساخته شده. با همان نام کاربری وارد شوید، یا در تلگرام بپرسید.",
  bad_biz: "نوع کسب‌وکار را انتخاب کنید.",
  bad_trade: "برای همکاران، نام مغازه، شماره پروانه کسب، شماره عضویت اتحادیه و نشانی مغازه لازم است.",
};
const errText = (e: unknown) => (e instanceof ApiError && ERR[e.code]) || "مشکلی پیش آمد. دوباره امتحان کنید.";
const tg = SHOP.telegram;
const Corners = () => <><i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden /></>;

// a line item's own photo, fetched with this party's token; quietly absent if it fails, never a broken image
function Photo({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u = ""; let dead = false;
    photoUrl(id).then(r => { if (dead) return; u = r; setUrl(r); }).catch(() => {});
    return () => { dead = true; if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url ? <img className="hs-photo" src={url} alt="" /> : null;
}

export default function Hesab() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [data, setData] = useState<Me | null>(null);
  const [err, setErr] = useState("");
  // an invite link (…/hesab/?ref=CODE): the sign-up form opens first, with the code filled in
  const [ref] = useState(refFromLink);
  // the rules must be signed (once, and again when they change) before the account opens
  const signed = useSigned(data), [passed, setPassed] = useState(false);

  const load = useCallback(async () => {
    try { setData(await me()); setPhase("in"); }
    catch (e) { setErr(e instanceof ApiError && e.status === 401 ? "" : errText(e)); setPhase("form"); }
  }, []);

  useEffect(() => {
    const h = location.hash, k = /[#&]k=([\w-]+)/.exec(h)?.[1];
    // the link's key is used once, so it leaves the address bar (and the history) straight away
    if (k) history.replaceState(null, "", location.pathname);
    (async () => {
      if (h === "#demo") { setData(SAMPLE); setPhase("in"); return; }
      if (k) {
        try { await redeem(k); }
        catch (e) { setErr(e instanceof ApiError && e.code === "expired" ? "این لینک ورود قبلاً استفاده شده یا وقتش گذشته. لینک تازه را از لئون گلد بخواهید." : errText(e)); setPhase("form"); return; }
      }
      if (k || getToken()) await load(); else setPhase("form");
    })();
  }, [load]);

  const out = async () => { if (!data?.demo) { await dropDevice(); await logout(); } if (location.hash) history.replaceState(null, "", location.pathname); setData(null); setErr(""); setPhase("form"); };

  const hint = <HomeHint />;
  if (phase === "in" && data && signed === null) return <Door name="حساب من" latin="LEON GOLD · MY ACCOUNT"><p className="hs-wait" aria-live="polite">در حال باز کردن…</p></Door>;
  if (phase === "in" && data && !signed && !passed) return <Onboard data={data} onDone={info => { if (info) setData({ ...data, info }); setPassed(true); }} />;
  if (phase === "in" && data) return <>{hint}<Panel data={data} onOut={out} onReload={data.demo ? undefined : load} /></>;
  return (
    <>{hint}<Door name="حساب من" latin="LEON GOLD · MY ACCOUNT" fine="فقط حساب خودتان را می‌بینید و در این صفحه چیزی تغییر نمی‌کند.">
        {phase === "boot" ? <p className="hs-wait" aria-live="polite">در حال باز کردن…</p>
          : <AuthSwap start={ref ? "up" : "in"} onSwap={() => setErr("")} render={(m, go) => m === "up"
              ? <SignUp ref0={ref} onBack={() => go("in")} onIn={load} />
              : <SignIn err={err} setErr={setErr} onIn={load} onUp={() => go("up")} />} />}
    </Door></>
  );
}

function SignIn({ err, setErr, onIn, onUp }: { err: string; setErr: (s: string) => void; onIn: () => Promise<void>; onUp: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    if (!u.trim() || !p) return setErr("نام کاربری و رمز را بنویسید.");
    setBusy(true); setErr("");
    try { await login(u, p); await onIn(); }
    catch (x) { setErr(errText(x)); }
    finally { setBusy(false); }
  };
  return (
    <form className="hs-form" onSubmit={send} noValidate>
      <label className="hs-field"><span>نام کاربری</span>
        <input value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" aria-describedby={err ? "hs-err" : undefined} />
      </label>
      <label className="hs-field"><span>رمز</span>
        <input type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" dir="ltr" aria-describedby={err ? "hs-err" : undefined} />
      </label>
      {err && <p className="hs-err" id="hs-err" role="alert">{err}</p>}
      <button className="btn btn-gold hs-wide" disabled={busy}>{busy ? "در حال ورود…" : "ورود"}</button>
      {typeof location !== "undefined" && /[?&]p=/.test(location.search) && <p className="hs-sent hs-fromsite">برای ثبت سفارش کاری که در ویترین دیدید، وارد شوید یا حساب بسازید.</p>}
      <div className="hs-or"><span>حساب ندارید؟</span></div>
      <button type="button" className="btn btn-ghost hs-wide hs-upbtn" onClick={onUp}>ثبت نام</button>
      <p className="hs-sent">اگر نام کاربری و رمز را فراموش کرده‌اید، <a href={tg} target="_blank" rel="noopener">در تلگرام بخواهید</a>.</p>
    </form>
  );
}

// «ثبت نام» (owner, 2026-11-09): the account opens at once, no approval. The kind of business decides the group: the
// trade («همکار») gives what only a real shop has; national code and mobile are required for everyone.
function SignUp({ ref0 = "", onBack, onIn }: { ref0?: string; onBack: () => void; onIn: () => Promise<void> }) {
  const [types, setTypes] = useState<BizType[] | null>(null);
  const [f, setF] = useState({ biz: "", fullName: "", mobile: "", nationalId: "", shop: "", city: "", birth: "", licence: "", union: "", shopAddr: "", username: "", password: "", password2: "", note: "", ref: ref0 });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState("");
  useEffect(() => { publicBiz().then(setTypes, () => setErr(ERR.offline)); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const bt = types?.find(t => t.k === f.biz), colleague = bt?.group === "colleague";
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    const mobile = latin(f.mobile).replace(/\D/g, ""), nid = latin(f.nationalId).replace(/\D/g, ""), username = latin(f.username).trim().toLowerCase();
    if (!bt) return setErr(ERR.bad_biz);
    if (f.fullName.trim().length < 3) return setErr(ERR.bad_name);
    if (!/^09\d{9}$/.test(mobile)) return setErr(ERR.bad_mobile);
    if (!nidOk(nid)) return setErr(ERR.bad_nid);
    if (colleague && (f.shop.trim().length < 2 || !/^\d{6,20}$/.test(latin(f.licence).replace(/\D/g, "")) || f.union.trim().length < 3 || f.shopAddr.trim().length < 10)) return setErr(ERR.bad_trade);
    if (f.birth.trim() && !/^1[34]\d\d\/\d{1,2}\/\d{1,2}$/.test(latin(f.birth).trim())) return setErr(ERR.bad_birth);
    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) return setErr(ERR.bad_username);
    if (latin(f.password).trim().length < 6) return setErr("رمز باید دست‌کم ۶ حرف یا رقم باشد.");
    if (f.password !== f.password2) return setErr("دو رمز یکی نیستند.");
    setBusy(true); setErr("");
    try {
      const r = await signup({ biz: bt.k, fullName: f.fullName.trim(), mobile, nationalId: nid, shop: f.shop.trim() || undefined, city: f.city.trim() || undefined, birth: latin(f.birth).trim() || undefined,
        ...(colleague ? { licence: latin(f.licence).replace(/\D/g, ""), union: latin(f.union).trim(), shopAddr: f.shopAddr.trim() } : {}), username, password: f.password, note: f.note.trim() || undefined, ref: latin(f.ref).trim() || undefined });
      setDone(r.username);
    } catch (x) { setErr(errText(x)); }
    finally { setBusy(false); }
  };
  if (done) return (
    <div className="hs-form hs-updone" role="status">
      <p className="hs-upok">حساب شما ساخته شد ✓</p>
      <p className="hs-sent">نام کاربری شما: <b dir="ltr" className="hs-uname">{done}</b><br />این نام کاربری و رمزتان را جایی یادداشت کنید؛ از این به بعد با همین‌ها وارد می‌شوید.</p>
      <button type="button" className="btn btn-gold hs-wide" disabled={busy} onClick={async () => { setBusy(true); try { await onIn(); } finally { setBusy(false); } }}>{busy ? "در حال باز کردن…" : "ورود به حساب من"}</button>
    </div>
  );
  return (
    <form className="hs-form" onSubmit={send} noValidate>
      <p className="hs-uphead">ثبت نام در «حساب من»</p>
      {ref0 && <p className="hs-sent hs-refnote">با دعوت یکی از مشتریان لئون گلد آمده‌اید؛ کد معرف پایین نوشته شده است.</p>}
      <label className="hs-field"><span>نوع کسب‌وکار *</span>
        <select value={f.biz} onChange={set("biz")} className="hs-select">
          <option value="">{types ? "— انتخاب کنید —" : "در حال آوردن…"}</option>
          {types && <optgroup label="مشتری (برای خودم می‌خرم)">{types.filter(t => t.group === "retail").map(t => <option key={t.k} value={t.k}>{t.name}</option>)}</optgroup>}
          {types && <optgroup label="همکار (از صنف طلا و جواهر)">{types.filter(t => t.group === "colleague").map(t => <option key={t.k} value={t.k}>{t.name}</option>)}</optgroup>}
        </select>
      </label>
      {colleague && <p className="hs-sent hs-trade-note">برای همکاران چند اطلاعات صنفی لازم است؛ لئون گلد آن‌ها را بررسی می‌کند.</p>}
      <label className="hs-field"><span>نام و نام خانوادگی *</span><input value={f.fullName} onChange={set("fullName")} autoComplete="name" maxLength={80} /></label>
      <label className="hs-field"><span>شماره موبایل *</span><input value={f.mobile} onChange={set("mobile")} autoComplete="tel" inputMode="tel" dir="ltr" placeholder="09xxxxxxxxx" maxLength={14} /></label>
      <label className="hs-field"><span>کد ملی *</span><input value={f.nationalId} onChange={set("nationalId")} inputMode="numeric" dir="ltr" maxLength={12} /></label>
      {colleague && <>
        <label className="hs-field"><span>نام مغازه یا کارگاه *</span><input value={f.shop} onChange={set("shop")} autoComplete="organization" maxLength={80} /></label>
        <label className="hs-field"><span>شماره پروانه کسب (جواز صنفی) *</span><input value={f.licence} onChange={set("licence")} inputMode="numeric" dir="ltr" maxLength={30} /></label>
        <label className="hs-field"><span>شماره عضویت اتحادیه طلا و جواهر *</span><input value={f.union} onChange={set("union")} dir="ltr" maxLength={30} /></label>
        <label className="hs-field"><span>نشانی مغازه (بازار، پاساژ، پلاک) *</span><input value={f.shopAddr} onChange={set("shopAddr")} maxLength={200} /></label>
      </>}
      {!colleague && <label className="hs-field"><span>شهر</span><input value={f.city} onChange={set("city")} autoComplete="address-level2" maxLength={40} /></label>}
      <label className="hs-field"><span>تاریخ تولد (برای تبریک؛ اختیاری)</span><input value={f.birth} onChange={set("birth")} inputMode="numeric" dir="ltr" placeholder="۱۳۷۰/۰۵/۱۲" maxLength={10} /></label>
      <label className="hs-field"><span>نام کاربری * (حروف انگلیسی یا عدد)</span><input value={f.username} onChange={set("username")} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" maxLength={40} /></label>
      <label className="hs-field"><span>رمز * (حداقل ۶ حرف یا عدد)</span><input type="password" value={f.password} onChange={set("password")} autoComplete="new-password" dir="ltr" maxLength={60} /></label>
      <label className="hs-field"><span>تکرار رمز *</span><input type="password" value={f.password2} onChange={set("password2")} autoComplete="new-password" dir="ltr" maxLength={60} /></label>
      <label className="hs-field"><span>کد معرف (اگر کسی دعوتتان کرده؛ اختیاری)</span><input value={f.ref} onChange={set("ref")} autoCapitalize="characters" spellCheck={false} dir="ltr" maxLength={12} /></label>
      <label className="hs-field"><span>توضیح (اختیاری)</span><textarea value={f.note} onChange={set("note")} rows={2} maxLength={300} placeholder="مثلاً از کجا ما را می‌شناسید" /></label>
      {err && <p className="hs-err" role="alert">{err}</p>}
      <button className="btn btn-gold hs-wide" disabled={busy}>{busy ? "در حال ساختن حساب…" : "ساختن حساب"}</button>
      <button type="button" className="hs-link hs-back" onClick={onBack}>حساب دارم؛ ورود</button>
      <p className="hs-sent">حساب همین الان ساخته می‌شود. اطلاعات شما فقط نزد لئون گلد می‌ماند.</p>
    </form>
  );
}

// ---------------- signed in ----------------

function Panel({ data, onOut, onReload }: { data: Me; onOut: () => void; onReload?: () => void }) {
  const [ai, setAi] = useState(0);
  // a tapped notification opens on its section (?t=orders), then the address is cleaned
  const [tab, setTabS] = useState<Tab>(() => { const t = typeof location === "undefined" ? "" : new URLSearchParams(location.search).get("t") || ""; return (["vitrin", "orders", "box", "stmt", "profile", "market"].includes(t) ? t : "home") as Tab; });
  const [openId] = useState(() => typeof location === "undefined" ? "" : new URLSearchParams(location.search).get("p") || "");
  useEffect(() => { if (location.search) history.replaceState(null, "", location.pathname + location.hash); }, []);
  const [menu, setMenu] = useState(false);
  const [username, setUsername] = useState(data.username);
  const [photo, setPhoto] = useState(data.photo);
  const setTab = (t: Tab) => { setTabS(t); scrollTo({ top: 0 }); };
  // from the menu: a section, or a card on one (the bank cards, today's price)
  const go = useCallback((t: Tab, id?: string) => { setMenu(false); setTab(t); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }, []);
  const closeMenu = useCallback(() => setMenu(false), []);
  useHomeApp(useCallback((t: string) => setTabS(t as Tab), []));
  const a = data.accounts[Math.min(ai, data.accounts.length - 1)];
  setRulesGroup(a.group);
  const isCustomer = a.kind !== "supplier", isSupplier = a.kind !== "customer" || a.work.length > 0; // any party the owner picked as an order's maker
  // a supplier only sees its work first; a party that is both sees its own orders, then its work
  const supplierFirst = isSupplier && !isCustomer;
  const blocks = [isCustomer && <Orders key="o" a={a} />, isSupplier && <WorkList key="w" a={a} />].filter(Boolean);
  if (supplierFirst) blocks.reverse();
  const open = a.orders.filter(o => o.status !== "done" && o.status !== "cancel");
  const settled = side(a.bal.g, "g") === "z" && side(a.bal.r, "r") === "z" && a.ent.length > 0;
  const tabs: [Tab, string, number?][] = isCustomer
    ? [["home", "خانه"], ["vitrin", "ویترین"], ["orders", "سفارش‌ها", open.length + (isSupplier ? a.work.length : 0)], ["box", "صندوقچه"], ["stmt", "صورتحساب"]]
    : [["home", "خانه"], ["orders", "کارها", a.work.length], ["vitrin", "محصولات من"], ["stmt", "صورتحساب"]]; // a supplier: only its own pieces, no prices
  const hour = new Date().getHours(), hello = hour < 12 ? "صبح بخیر" : hour < 17 ? "روز بخیر" : "عصر بخیر";

  return (
    <div className="hs-app has-tabs">
      <header className="hs-bar">
        <button type="button" className="hs-burger" onClick={() => setMenu(true)} aria-label="منو" aria-expanded={menu} aria-haspopup="dialog"><i /><i /><i /></button>
        <a className="hs-brand" href="../"><img src="/leaf.png" alt="" width={28} height={28} /><span className="leaf">لئون گلد</span></a>
        <span className="hs-bar-t">حساب من</span>
        <ThemeToggle className="hs-theme" />
        <Avatar name={a.name} photo={photo} current={tab === "profile"} onClick={() => setTab("profile")} />
      </header>
      <div className="hs-orbs" aria-hidden><i /><i /><i /></div>
      {/* desktop: the sections in a floating panel (owner, 2026-11-10, after a reference dashboard); the phone keeps the bar and the tabs */}
      <aside className="hs-side" aria-label="بخش‌های حساب من">
        <a className="hs-side-brand" href="../"><img src="/leaf.png" alt="" width={30} height={30} /><span><b className="leaf">لئون گلد</b><small>حساب من</small></span></a>
        <p className="hs-side-g">بخش‌ها</p>
        {[...tabs, ...(a.market ? [["market", "تحلیل بازار"] as [Tab, string]] : []), ["profile", "پروفایل من"] as [Tab, string]].map(([k, t, n]) => (
          <button key={k} type="button" className="hs-side-it" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>
            <svg viewBox="0 0 24 24" aria-hidden><path d={ICONS[k]} /></svg><span>{t}</span>{n ? <em>{faDigits(n)}</em> : null}
          </button>
        ))}
        <button type="button" className="hs-side-it" onClick={() => setMenu(true)}><svg viewBox="0 0 24 24" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg><span>همه‌ی کارها</span></button>
        <div className="hs-side-foot">
          <ThemeToggle className="hs-theme" />
          <div className="hs-side-me"><Avatar name={a.name} photo={photo} current={tab === "profile"} onClick={() => setTab("profile")} /><span><b>{a.name}</b><small>{KIND[a.kind]}{a.vip ? " · VIP" : ""}</small></span></div>
        </div>
      </aside>
      {data.demo && <p className="hs-demo-band" role="note">این یک حساب نمونه است، با رقم‌های ساختگی؛ فقط برای دیدن شکل پنل.</p>}
      <main className={"hs-main" + (tab === "vitrin" ? " hs-main-wide" : "")}>
        {tab === "home" && <>
          <div className="hs-who">
            <p className="hs-hello">{hello}</p>
            <h1>{a.name}</h1>
            <p>{a.shop ? a.shop + " · " : ""}<span className="hs-kind">{KIND[a.kind]}</span></p>
            {data.accounts.length > 1 && (
              <div className="hs-seg hs-acc" role="tablist" aria-label="حساب‌ها">
                {data.accounts.map((x, i) => <button key={x.id} type="button" role="tab" aria-selected={i === ai} onClick={() => setAi(i)}>{x.shop || x.name}</button>)}
              </div>
            )}
          </div>
          <div className="hs-dash">
          {isCustomer && <MemberCard a={a} />}
          {a.market && <MarketCard onOpen={() => setTab("market")} />}
          {isCustomer && open.map(o => <Journey key={o.ref} o={o} />)}
          <Quick customer={isCustomer} />
          <Slip a={a} />
          {settled && <Seal />}
          {isCustomer && <PayCard a={a} />}
          {isCustomer && <ReceiptUpload opener={!(a.bal.r > 0.5)} demo={data.demo} />}
          <PriceCard />
          </div>
          <footer className="hs-foot">
            <p>{data.updated ? `آخرین ثبت در دفتر: ${jdate(data.updated)}، ساعت ${jtime(data.updated)}` : ""}{onReload && <> · <button type="button" className="hs-link" onClick={onReload}>تازه کردن</button></>}</p>
            {username && <p>نام کاربری: <b dir="ltr">{username}</b> · <button type="button" className="hs-link" onClick={() => setTab("profile")}>تغییر نام کاربری یا رمز</button></p>}
            <p><button type="button" className="hs-link" onClick={openRules}>آیین‌نامه‌ی خرید و فروش لئون گلد</button></p>
            <p>رقمی با حساب شما نمی‌خواند؟ <a href={tg} target="_blank" rel="noopener">در تلگرام بگویید</a>؛ اشتباه از طرفین قابل برگشت است.</p>
          </footer>
        </>}
        {tab === "profile" && <Profile a={a} data={{ ...data, username, photo }} onUsername={setUsername} onPhoto={setPhoto} />}
        {tab === "vitrin" && <Vitrin demo={data.demo} openId={openId} onlyMine={!isCustomer} />}
        {tab === "orders" && blocks}
        {tab === "market" && a.market && <Market />}
        {tab === "box" && <><JewelBox a={a} /><Summary ent={a.ent} /></>}
        {tab === "stmt" && <>{isCustomer && <MyReceipts demo={data.demo} />}<Statement a={a} /></>}
      </main>
      <TabBar tab={tab} setTab={setTab} tabs={tabs} />
      <Menu open={menu} onClose={closeMenu} a={a} data={{ ...data, username }} tab={tab} go={go} onReload={onReload} onOut={onOut} />
      <Rules />
    </div>
  );
}

// the assay slip: each balance stamped with what it means for the reader, never converted at today's price
function Slip({ a }: { a: Account }) {
  const row = (u: "g" | "r") => {
    const v = a.bal[u], s = side(v, u);
    const word = s === "z" ? "تسویه" : s === "dr" ? "بدهی شما به لئون" : "طلب شما از لئون";
    return (
      <div className={"hs-bal " + s}>
        <span className="hs-bal-k">{u === "g" ? "حساب طلایی" : "حساب ریالی"}</span>
        <b className="num hs-bal-v">{s === "z" ? "۰" : u === "g" ? gram(v) : rial(v)}<small>{u === "g" ? "گرم ۱۸ عیار" : "ریال"}</small></b>
        <span className="hs-stamp">{word}</span>
        {u === "r" && s !== "z" && <span className="hs-bal-sub num">{toman(v)} تومان</span>}
      </div>
    );
  };
  return (
    <section className="hs-slip paper" aria-label="مانده‌ی حساب">
      <Corners />
      <div className="hs-slip-rose" aria-hidden />
      <h2 className="hs-h">مانده‌ی امروز</h2>
      <div className="hs-bals">{row("g")}{row("r")}</div>
      <p className="hs-slip-note">گرم‌ها به عیار ۷۵۰ حساب شده‌اند و هیچ‌وقت با قیمت روز به ریال تبدیل نمی‌شوند.</p>
    </section>
  );
}

const STEPS = [["new", "ثبت شد"], ["src", "در حال تهیه"], ["ready", "آماده تحویل"], ["done", "تحویل شد"]] as const;
function Steps({ status }: { status: string }) {
  if (status === "cancel") return <p className="hs-cancel">این سفارش لغو شده است.</p>;
  const at = Math.max(0, STEPS.findIndex(s => s[0] === status));
  return (
    <ol className="hs-steps" aria-label="مرحله‌ی سفارش">
      {STEPS.map(([k, t], i) => <li key={k} className={i < at ? "past" : i === at ? "now" : ""} aria-current={i === at ? "step" : undefined}><i aria-hidden />{t}</li>)}
    </ol>
  );
}
const late = (due: string, status: string) => status !== "done" && status !== "cancel" && dayNum(due) > 0 && dayNum(due) < today();
const spec = (x: { qty: number; weight: number; carat: number }) => [x.qty > 1 ? faDigits(x.qty) + " عدد" : "", x.weight ? gram(x.weight) + " گرم" : "", x.carat ? "عیار " + faDigits(x.carat) : ""].filter(Boolean).join(" · ");

function Orders({ a }: { a: Account }) {
  const open = a.orders.filter(o => o.status !== "done" && o.status !== "cancel"), past = a.orders.filter(o => !open.includes(o));
  const [all, setAll] = useState(false);
  const shown = all ? a.orders : open.length ? open : past.slice(0, 1);
  return (
    <section className="hs-sec" aria-labelledby="hs-o">
      <div className="hs-sec-head">
        <h2 className="hs-h" id="hs-o">سفارش‌های شما</h2>
        <a className="hs-link" href={tg} target="_blank" rel="noopener">سفارش تازه</a>
      </div>
      {!a.orders.length ? <p className="hs-empty">هنوز سفارشی برایتان ثبت نشده. هر وقت سفارش ساخت بدهید، مرحله‌به‌مرحله همین‌جا دیده می‌شود.</p> : (
        <ul className="hs-list">
          {shown.map(o => (
            <li key={o.ref} className="hs-item paper">
              <div className="hs-item-top">
                <b>{o.items.map(i => i.desc).filter(Boolean).join("، ") || "سفارش"}</b>
                <span className="num hs-ref">#{o.ref}</span>
              </div>
              <p className="hs-meta">{[o.date && "ثبت " + o.date, o.due && "موعد " + o.due + (dueText(o.due) && o.status !== "done" && o.status !== "cancel" ? " (" + dueText(o.due) + ")" : ""), o.deposit ? "بیعانه " + toman(o.deposit) + " تومان" : ""].filter(Boolean).join(" · ")}
                {late(o.due, o.status) && <span className="hs-late">از موعد گذشته</span>}</p>
              {o.items.length > 0 && <ul className="hs-lines">{o.items.map((i, n) => <li key={n}><span className="hs-line-main">{i.photo && <Photo id={i.photo} />}{i.desc}</span><span className="num">{spec(i)}</span></li>)}</ul>}
              <Steps status={o.status} />
            </li>
          ))}
        </ul>
      )}
      {a.orders.length > shown.length && <button type="button" className="hs-link hs-more" onClick={() => setAll(true)}>همه‌ی سفارش‌ها ({faDigits(a.orders.length)})</button>}
    </section>
  );
}

function WorkList({ a }: { a: Account }) {
  return (
    <section className="hs-sec" aria-labelledby="hs-w">
      <div className="hs-sec-head"><h2 className="hs-h" id="hs-w">کارهای سپرده به شما</h2><span className="hs-count num">{faDigits(a.work.length)} قلم باز</span></div>
      {!a.work.length ? <p className="hs-empty">فعلاً کار بازی به شما سپرده نشده.</p> : (
        <ul className="hs-list">
          {a.work.map((w, n) => (
            <li key={w.ref + n} className={"hs-item paper" + (late(w.due, w.status) ? " is-late" : "")}>
              <div className="hs-item-top"><b className="hs-line-main">{w.photo && <Photo id={w.photo} />}{w.desc || "قلم سفارش"}</b><span className="num hs-ref">#{w.ref}</span></div>
              <p className="hs-meta num">{spec(w)}</p>
              <p className="hs-meta">{w.due ? "موعد " + w.due : "بدون موعد"} · {w.statusLabel}{late(w.due, w.status) && <span className="hs-late">از موعد گذشته</span>}</p>
              {w.status !== "ready" && (
                <a className="btn btn-ink hs-ready" href={tg} target="_blank" rel="noopener">اعلام آماده بودن</a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// a photo of a card-to-card transfer receipt: shrunk on the phone before it ever leaves it, stored PENDING
// and touching no balance until Leon records the real document in the ledger by hand
function ReceiptUpload({ opener = true, demo }: { opener?: boolean; demo?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const o = () => { setOpen(true); setSent(false); setTimeout(() => document.getElementById("hs-receipt")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
    addEventListener("hs-receipt", o); return () => removeEventListener("hs-receipt", o); }, []);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const pick = (f: File | null) => {
    setFile(f); setErr("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  };
  const send = async () => {
    if (!file || busy) return;
    setBusy(true); setErr("");
    if (demo) { setSent(true); pick(null); setBusy(false); return; }
    try {
      const dataUrl = await shrinkPhoto(file);
      const toman1 = latin(amount).replace(/\D/g, "");
      await sendReceipt(dataUrl, toman1 ? +toman1 * 10 : undefined, date.trim() || undefined);
      setSent(true); pick(null); setAmount(""); setDate(""); dispatchEvent(new Event("hs-receipt-sent"));
    } catch (x) { setErr(errText(x)); }
    finally { setBusy(false); }
  };

  if (!open) return !opener ? null : (
    <button type="button" className="btn btn-ink hs-receipt-open" onClick={() => { setOpen(true); setSent(false); }}>ارسال رسید کارت‌به‌کارت</button>
  );
  return (
    <section id="hs-receipt" className="hs-sec hs-receipt paper" aria-label="ارسال رسید کارت‌به‌کارت">
      <Corners />
      <h2 className="hs-h">رسید کارت‌به‌کارت</h2>
      {sent ? (
        <>
          <p className="hs-sent">{demo ? "در حساب نمونه رسید فرستاده نمی‌شود؛ در حساب واقعی، لئون آن را می‌بیند و بعد از ثبت سند واقعی در دفتر، حسابتان به‌روز می‌شود." : "رسید فرستاده شد؛ لئون آن را می‌بیند و بعد از ثبت سند واقعی در دفتر، حسابتان به‌روز می‌شود."}</p>
          <button type="button" className="hs-link" onClick={() => setOpen(false)}>بستن</button>
        </>
      ) : (
        <>
          <p className="hs-sent">این رسید فقط برای اطلاع است؛ تا لئون سند واقعی را در دفتر ثبت نکند، به حسابتان افزوده نمی‌شود.</p>
          <label className="btn btn-ink hs-receipt-pick">
            {file ? "عوض کردن عکس رسید" : "گرفتن یا انتخاب عکس رسید"}
            <input type="file" accept="image/*" onChange={e => pick(e.target.files?.[0] || null)} />
          </label>
          {preview && <img className="hs-photo hs-receipt-prev" src={preview} alt="" />}
          <label className="hs-field"><span>مبلغ (تومان، اختیاری)</span>
            <input className="num" value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" dir="ltr" placeholder="۵۰۰۰۰۰۰" />
          </label>
          <label className="hs-field"><span>تاریخ (اختیاری)</span>
            <input value={date} onChange={e => setDate(e.target.value)} placeholder="۱۴۰۵/۰۸/۱۰" />
          </label>
          {err && <p className="hs-err" role="alert">{err}</p>}
          <div className="hs-row">
            <button type="button" className="btn btn-gold" disabled={!file || busy} onClick={send}>{busy ? "در حال فرستادن…" : "فرستادن رسید"}</button>
            <button type="button" className="hs-link" onClick={() => setOpen(false)}>انصراف</button>
          </div>
        </>
      )}
    </section>
  );
}

// the statement from the first document to the last, by month; each row says plainly what it did and the balance after it.
// «گزارش کامل (PDF)» gives the same on A4 pages with the invoice lines (components/hesab/Report.tsx)
function Statement({ a }: { a: Account }) {
  const [u, setU] = useState<"all" | "g" | "r">("all");
  const [inv, setInv] = useState<Entry | null>(null);
  const [simple, setSimple] = useState(false);
  const [pdf, setPdf] = useState(""), [pdfMsg, setPdfMsg] = useState("");
  const closeInv = useCallback(() => { setInv(null); setSimple(false); }, []), failInv = useCallback(() => setSimple(true), []);
  const all = useMemo(() => chrono(a.ent), [a.ent]);
  const rows = useMemo(() => all.filter(e => u === "all" || e.u === u), [all, u]);
  const groups = useMemo(() => { const g: { key: string; title: string; rows: typeof rows }[] = []; for (const r of rows) { const k = r.day.slice(0, 7) || "-"; if (!g.length || g[g.length - 1].key !== k) g.push({ key: k, title: r.day ? monthTitle(r.day) : "بدون تاریخ", rows: [] }); g[g.length - 1].rows.push(r); } return g; }, [rows]);
  const units = (u === "all" ? ["g", "r"] : [u]) as ("g" | "r")[];
  const makePdf = async (share: boolean) => {
    if (pdf) return; setPdf(share ? "share" : "save"); setPdfMsg("در حال ساخت گزارش…");
    try { const r = await statementPdf(a, share); setPdfMsg(r === "saved" ? "فایل PDF ذخیره شد." : ""); }
    catch (e) { setPdfMsg((e as Error)?.name === "AbortError" ? "" : "گزارش ساخته نشد. یک بار دیگر بزنید."); }
    finally { setPdf(""); }
  };
  return (
    <section className="hs-sec" aria-labelledby="hs-s">
      <div className="hs-sec-head">
        <h2 className="hs-h" id="hs-s">صورتحساب</h2>
        <div className="hs-seg hs-mini" role="radiogroup" aria-label="کدام حساب">
          {([["all", "همه"], ["g", "طلایی"], ["r", "ریالی"]] as const).map(([k, t]) => <button key={k} type="button" role="radio" aria-checked={u === k} onClick={() => setU(k)}>{t}</button>)}
        </div>
      </div>
      <div className="hs-rep paper">
        {units.map(x => { const t = totals(all, x), bal = x === "g" ? a.bal.g : a.bal.r; return (
          <div key={x} className="hs-rep-u">
            <h3>{x === "g" ? "حساب طلایی (گرم ۷۵۰)" : "حساب ریالی"}</h3>
            <dl className="num">
              <div><dt>جمع بدهکار</dt><dd className="dr">{faDigits(num(t.debit, x))}</dd></div>
              <div><dt>جمع بستانکار</dt><dd className="cr">{faDigits(num(t.credit, x))}</dd></div>
              <div className="big"><dt>مانده</dt><dd className={side(bal, x)}>{faDigits(num(bal, x))} <em>{sideWord(bal, x)}</em></dd></div>
            </dl>
          </div>); })}
        <div className="hs-row hs-rep-act">
          <button type="button" className="btn btn-gold" disabled={!!pdf} onClick={() => makePdf(false)}>{pdf === "save" ? "در حال ساخت…" : "گزارش کامل (PDF)"}</button>
          <button type="button" className="hs-link" disabled={!!pdf} onClick={() => makePdf(true)}>{pdf === "share" ? "در حال ساخت…" : "فرستادن"}</button>
        </div>
        {pdfMsg && <p className="hs-why" role="status">{pdfMsg}</p>}
      </div>
      {!rows.length ? <p className="hs-empty">هنوز سندی ثبت نشده.</p> : groups.map(g => (
        <div key={g.key} className="hs-month-g">
        <h3 className="hs-month">{g.title}</h3>
        <ol className="hs-stmt paper">
          {g.rows.map((e, i) => {
            const body = (
              <>
                <span className="hs-st-d num"><bdi dir="ltr">{faDigits(e.day || jdate(e.ts))}</bdi></span>
                <span className="hs-st-l"><EntryIcon e={e} />{faDigits(e.label)}</span>
                {(() => { const g = e.gross ?? e.d, w = e.u === "g" ? "گرم" : "ریال"; return <span className={"hs-st-a num " + side(g, e.u)}>{e.u === "g" ? gram(g) : rial(g)}<small>{w} {g > 0 ? "بدهکار" : g < 0 ? "بستانکار" : ""}</small></span>; })()}
                {e.gross !== undefined && Math.abs(e.gross - e.d) >= (e.u === "g" ? 0.0005 : 0.5) && <span className="hs-st-r hs-st-pay num">{e.gross - e.d > 0 ? "دریافت در همین فاکتور" : "پرداخت در همین فاکتور"}: {num(e.gross - e.d, e.u)} {e.u === "g" ? "گرم" : "ریال"} <em>{e.gross - e.d > 0 ? "بستانکار" : "بدهکار"}</em></span>}
                <span className="hs-st-r num">مانده پس از این سند: {num(e.run, e.u)} {e.u === "g" ? "گرم" : "ریال"} <em>{sideWord(e.run, e.u)}</em></span>
              </>
            );
            return (
              <li key={e.ts + e.label + i}>
                {e.sheet || e.lines?.length ? <button type="button" className="hs-st-row hs-st-open" onClick={() => setInv(e)} aria-haspopup="dialog">{body}</button> : <div className="hs-st-row">{body}</div>}
              </li>
            );
          })}
        </ol>
        </div>
      ))}
      {inv && (inv.sheet && !simple ? <LedgerInvoice e={inv} onClose={closeInv} onFail={failInv} /> : <InvoiceSheet e={inv} name={a.name} onClose={closeInv} />)}
      <p className="hs-legend"><b className="dr">بدهکار</b> یعنی بدهی شما به لئون گلد بیشتر شد · <b className="cr">بستانکار</b> یعنی از بدهی‌تان کم شد یا طلب‌تان بیشتر شد. سندها از اولین تا آخرین، به ترتیب تاریخ.</p>
    </section>
  );
}
