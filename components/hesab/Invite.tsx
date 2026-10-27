"use client";
// The owner's side of «حساب من» (hesab/#owner, or hesab/#owner/<partyId> with that person chosen): pick a customer or supplier from the ledger and make their one-time
// sign-in link, then send it on WhatsApp or copy it; or sign a party out of every device. It uses the CRM panel's
// sign-in (the same sync username and password), so an owner already in the panel is already in here.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Door from "@/components/Door";
import { LoginNeeded, emptyStore, getSession, login, logout as signOut, onSession, pull, sessionUser, waLink, type Party } from "@/lib/crm";
import { ApiError, faDigits, invite, latin, revoke } from "@/lib/hesab";

const KIND: Record<string, string> = { customer: "مشتری", supplier: "تأمین‌کننده", both: "مشتری و تأمین‌کننده" };
const norm = (s: string) => latin(s).replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[\s‌]+/g, " ").trim().toLowerCase();

export default function Invite({ pick = "" }: { pick?: string }) {
  // the panel's session: signing in or out there (or here) shows at once; undefined until the browser has it
  const user = useSyncExternalStore(onSession, sessionUser, () => undefined);
  if (user === undefined) return null;
  return user ? <Parties onOut={signOut} pick={pick} /> : <OwnerLogin onIn={() => {}} />;
}

function OwnerLogin({ onIn }: { onIn: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u.trim() || !p) return setErr("نام کاربری و رمز را بنویس.");
    setBusy(true); setErr("");
    try { await login(u, p); onIn(); }
    catch (x) { setErr(x instanceof LoginNeeded ? "نام کاربری یا رمز درست نیست." : (x as Error).message === "too_many" ? "چند بار اشتباه شد؛ ربع ساعت دیگر دوباره امتحان کن." : "به سرور وصل نشد. اینترنت را ببین."); }
    setBusy(false);
  };
  return (
    <Door name="لینک ورود مشتری" latin="LEON GOLD · SIGN-IN LINKS" fine="فقط برای مدیر لئون گلد؛ همان ورود «پنل مدیریت».">
      <form className="hs-form" onSubmit={send} noValidate>
        <p className="hs-sent">با نام کاربری و رمز «دفتر لئون» وارد شو؛ بعد برای هر مشتری یا تأمین‌کننده یک لینک ورود یک‌بارمصرف می‌سازی.</p>
        <label className="hs-field"><span>نام کاربری</span><input value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoCapitalize="none" dir="ltr" /></label>
        <label className="hs-field"><span>رمز</span><input value={p} onChange={e => setP(e.target.value)} type="password" autoComplete="current-password" dir="ltr" /></label>
        {err && <p className="hs-err" role="alert">{err}</p>}
        <button className="btn btn-gold hs-wide" disabled={busy}>{busy ? "در حال ورود…" : "ورود"}</button>
      </form>
      <a className="hs-demo" href="./">بازگشت به «حساب من»</a>
    </Door>
  );
}

type Made = { link: string; days: number };

function Parties({ onOut, pick }: { onOut: () => void; pick: string }) {
  const [list, setList] = useState<Party[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(pick);

  const fail = (x: unknown) => {
    if (x instanceof LoginNeeded || (x instanceof ApiError && x.status === 401)) return onOut();
    setErr(x instanceof ApiError && x.code === "offline" ? "به سرور وصل نشد. اینترنت را ببین." : "مشکلی پیش آمد. دوباره امتحان کن.");
  };
  useEffect(() => {
    pull(emptyStore()).then(st => setList(Object.values(st.parties).filter(p => p.name).sort((a, b) => a.name.localeCompare(b.name, "fa"))), fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => {
    const n = norm(q);
    const all = list || [];
    if (only && !n) { const one = all.filter(p => p.id === only); if (one.length || !list) return one; }
    return n ? all.filter(p => norm([p.name, p.shop, p.phone].filter(Boolean).join(" ")).includes(n)) : all;
  }, [list, q, only]);

  return (
    <div className="hs-app">
      <header className="hs-bar">
        <a className="hs-brand" href="../"><img src="/leaf.png" alt="" width={28} height={28} /><span className="leaf">لئون گلد</span></a>
        <span className="hs-bar-t">لینک ورود</span>
        <a className="hs-out" href="../panel/">پنل مدیریت</a>
      </header>
      <main className="hs-main">
        <div className="hs-who">
          <h1>لینک ورود «حساب من»</h1>
          <p>هر لینک فقط یک بار کار می‌کند و تا ۷ روز اعتبار دارد. لینک تازه، لینک قبلیِ همان شخص را باطل می‌کند.</p>
        </div>
        <label className="hs-field iv-search"><span>جست‌وجو در مشتریان و تأمین‌کنندگان دفتر</span>
          <input type="search" value={q} onChange={e => { setQ(e.target.value); setOnly(""); }} placeholder="نام، فروشگاه یا موبایل" enterKeyHint="search" />
        </label>
        {err && <p className="hs-err iv-err" role="alert">{err}</p>}
        {!list ? (!err && <p className="hs-empty" aria-live="polite">در حال خواندن دفتر…</p>)
          : !shown.length ? <p className="hs-empty">{list.length ? "کسی با این نام پیدا نشد." : "هنوز هیچ مشتری یا تأمین‌کننده‌ای در دفتر نیست."}</p>
          : (
            <ul className="hs-list">
              {shown.slice(0, 40).map(p => <Row key={p.id} p={p} onFail={fail} />)}
            </ul>
          )}
        {shown.length > 40 && <p className="hs-count">{faDigits(shown.length - 40)} نفر دیگر؛ نام را دقیق‌تر بنویس.</p>}
      </main>
    </div>
  );
}

function Row({ p, onFail }: { p: Party; onFail: (x: unknown) => void }) {
  const [made, setMade] = useState<Made | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const token = () => getSession()?.token || "";

  const make = async () => {
    setBusy(true); setNote("");
    try { setMade(await invite(token(), p.id)); }
    catch (x) { onFail(x); }
    setBusy(false);
  };
  const out = async () => {
    if (!confirm(`${p.name} از «حساب من» در همه‌ی دستگاه‌ها خارج شود و لینک‌های ساخته‌شده‌اش باطل شوند؟`)) return;
    setBusy(true);
    try { await revoke(token(), p.id); setMade(null); setNote("خارج شد؛ لینک‌های قبلی هم دیگر کار نمی‌کنند."); }
    catch (x) { onFail(x); }
    setBusy(false);
  };
  const copy = async () => {
    if (!made) return;
    try { await navigator.clipboard.writeText(made.link); setNote("لینک کپی شد."); } catch { setNote("کپی نشد؛ لینک بالا را نگه دار و کپی کن."); }
  };
  const text = made ? `سلام ${p.name}، این لینک ورود شما به «حساب من» لئون گلد است؛ مانده‌ی حساب و سفارش‌هایتان را آنجا می‌بینید. لینک فقط یک بار کار می‌کند و تا ${faDigits(made.days)} روز معتبر است:\n${made.link}` : "";
  const wa = made ? waLink(p.phone, text) || "https://wa.me/?text=" + encodeURIComponent(text) : "";

  return (
    <li className="hs-item paper iv-row">
      <div className="hs-item-top">
        <b>{p.name}</b>
        <span className="hs-kind iv-kind">{KIND[p.kind || "customer"] || "مشتری"}</span>
      </div>
      <p className="hs-meta">{[p.shop, p.phone && faDigits(p.phone)].filter(Boolean).join(" · ") || "بدون شماره‌ی موبایل در دفتر"}</p>
      {made ? (
        <div className="iv-made">
          <input className="iv-link" readOnly value={made.link} dir="ltr" aria-label={"لینک ورود " + p.name} onFocus={e => e.currentTarget.select()} />
          <div className="iv-acts">
            <a className="btn btn-gold" href={wa} target="_blank" rel="noopener">{p.phone ? "فرستادن در واتس‌اپ" : "فرستادن در واتس‌اپ (انتخاب مخاطب)"}</a>
            <button type="button" className="btn btn-ink iv-copy" onClick={copy}>کپی لینک</button>
          </div>
        </div>
      ) : (
        <div className="iv-acts">
          <button type="button" className="btn btn-gold" disabled={busy} onClick={make}>{busy ? "در حال ساخت…" : "ساخت لینک ورود"}</button>
        </div>
      )}
      {note && <p className="hs-meta iv-note" role="status">{note}</p>}
      <button type="button" className="hs-link iv-revoke" disabled={busy} onClick={out}>خروج از همه‌ی دستگاه‌ها</button>
    </li>
  );
}
