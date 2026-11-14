"use client";
// «حساب من» on first entry (and again whenever the rules change): the rules of buying and selling in full, a box the
// party must tick, «خواندم و می‌پذیرم», as its electronic signature (the server keeps the exact text, the time, its
// address and browser: leon-gold-server/portal.mjs /api/portal/terms/accept), then its own details to fill in if it wants.
import { useEffect, useState } from "react";
import Door from "@/components/Door";
import { rulesFor, rulesTitleFor } from "@/lib/content";
import { ApiError, acceptTerms, faDigits, saveInfo, termsHash, type Account, type Info, type Me } from "@/lib/hesab";

// the exact words signed: the title, then each section with its clauses numbered
// retail buyers sign the retail rules (lib/content.ts RULES_RETAIL), the trade the full ones
export const rulesText = (group?: string) => [rulesTitleFor(group), ...rulesFor(group).map(r => [r.title, ...(r.items || []).map((t, i) => `${i + 1}. ${t}`), r.text || ""].filter(Boolean).join("\n"))].join("\n\n");
export const AGREE = "متن کامل آیین‌نامه‌ی لئون گلد را خواندم، مفاد آن را می‌پذیرم و تأیید می‌کنم. این تأیید، امضای الکترونیکی من است.";

// has this party signed the rules as they read today
export function useSigned(data: Me | null) {
  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    let dead = false;
    termsHash(rulesText(data?.accounts[0]?.group)).then(h => { if (!dead) setHash(h); }).catch(() => { if (!dead) setHash(""); });
    return () => { dead = true; };
  }, [data?.accounts[0]?.group]);
  if (!data) return null;
  if (data.demo) return true;
  if (hash === null) return null;
  return hash ? data.terms?.hash === hash : !!data.terms;
}

export function Onboard({ data, onDone }: { data: Me; onDone: (info?: Info) => void }) {
  const [step, setStep] = useState<"rules" | "info">("rules");
  const g = data.accounts[0]?.group;
  const [tick, setTick] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const sign = async () => {
    if (!tick || busy) return; setBusy(true); setErr("");
    try { await acceptTerms(rulesText(g), AGREE); setStep("info"); }
    catch (e) { setErr(e instanceof ApiError && e.code === "offline" ? "به سرور وصل نشدیم. اینترنت را بررسی کنید و دوباره بزنید." : "ثبت نشد. یک بار دیگر بزنید."); }
    finally { setBusy(false); }
  };
  if (step === "info") return (
    <Door name="اطلاعات من" latin="LEON GOLD · MY DETAILS" fine="پر کردن هیچ‌کدام اجباری نیست؛ بعداً هم از «پروفایل من» می‌توانید کاملش کنید.">
      <InfoForm a={data.accounts[0]} info={data.info} onSaved={i => onDone(i)} onSkip={() => onDone()} />
    </Door>);
  return (
    <Door name="آیین‌نامه" latin="LEON GOLD · TERMS" fine="برای ورود به «حساب من»، یک بار این آیین‌نامه را بخوانید و بپذیرید.">
      <div className="hs-terms">
        <h2 className="hs-terms-t">{rulesTitleFor(g)}</h2>
        <div className="hs-terms-box" tabIndex={0} aria-label="متن آیین‌نامه">
          {rulesFor(g).map(r => (
            <section key={r.title}>
              <h3>{r.title}</h3>
              {r.items && <ol>{r.items.map(t => <li key={t}>{t}</li>)}</ol>}
              {r.text && <p>{r.text}</p>}
            </section>
          ))}
        </div>
        <label className="hs-agree">
          <input type="checkbox" checked={tick} onChange={e => setTick(e.target.checked)} />
          <span>{AGREE}</span>
        </label>
        <p className="hs-terms-fine">با زدن «تأیید و ورود»، تاریخ و ساعت، نشانی اینترنت و نوع دستگاه شما همراه همین متن به‌عنوان امضای الکترونیکی‌تان ثبت می‌شود.</p>
        {err && <p className="hs-err" role="alert">{err}</p>}
        <button type="button" className="btn btn-gold hs-wide" disabled={!tick || busy} onClick={sign}>{busy ? "در حال ثبت…" : "تأیید و ورود"}</button>
      </div>
    </Door>);
}

// the party's own details; nothing is required. Prefilled from what it wrote before, else from its ledger card
const FIELDS: { k: keyof Info; label: string; num?: boolean; ltr?: boolean; wide?: boolean; ph?: string }[] = [
  { k: "fullName", label: "نام و نام خانوادگی" }, { k: "shop", label: "نام فروشگاه یا کارگاه" },
  { k: "mobile", label: "موبایل", num: true, ltr: true }, { k: "phone", label: "تلفن ثابت", num: true, ltr: true },
  { k: "nationalId", label: "کد ملی", num: true, ltr: true }, { k: "birth", label: "تاریخ تولد", num: true, ltr: true, ph: "۱۳۷۰/۰۱/۰۱" },
  { k: "email", label: "ایمیل", ltr: true }, { k: "postal", label: "کد پستی", num: true, ltr: true },
  { k: "address", label: "نشانی", wide: true },
];
const toLatin = (s: string) => s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
export function InfoForm({ a, info, demo, onSaved, onSkip }: { a: Account; info?: Info | null; demo?: boolean; onSaved: (i: Info) => void; onSkip?: () => void }) {
  const [v, setV] = useState<Info>(() => info ? { ...info } : { fullName: a.name, shop: a.shop, mobile: a.phone ? toLatin(a.phone) : "" });
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setMsg(null);
    const clean = Object.fromEntries(FIELDS.map(f => [f.k, f.num ? toLatin(String(v[f.k] || "")).trim() : String(v[f.k] || "").trim()])) as Info;
    try { if (demo) { setMsg({ ok: true, t: "در حساب نمونه چیزی ذخیره نمی‌شود." }); return; } const r = await saveInfo(clean); setMsg({ ok: true, t: "ذخیره شد." }); onSaved(r.info); }
    catch { setMsg({ ok: false, t: "ذخیره نشد. یک بار دیگر بزنید." }); }
    finally { setBusy(false); }
  };
  return (
    <form className="hs-form hs-info" onSubmit={send} noValidate>
      <div className="hs-info-grid">
        {FIELDS.map(f => (
          <label key={f.k} className={"hs-field" + (f.wide ? " wide" : "")}><span>{f.label}</span>
            <input value={f.num ? faDigits(String(v[f.k] || "")) : String(v[f.k] || "")} onChange={e => setV(x => ({ ...x, [f.k]: e.target.value }))}
              dir={f.ltr ? "ltr" : undefined} inputMode={f.num ? "numeric" : f.k === "email" ? "email" : undefined} placeholder={f.ph}
              autoComplete={f.k === "fullName" ? "name" : f.k === "mobile" ? "tel" : f.k === "email" ? "email" : f.k === "address" ? "street-address" : f.k === "postal" ? "postal-code" : "off"} />
          </label>))}
      </div>
      {msg && <p className={msg.ok ? "hs-ok" : "hs-err"} role={msg.ok ? "status" : "alert"}>{msg.t}</p>}
      <button className="btn btn-gold hs-wide" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره"}</button>
      {onSkip && <button type="button" className="hs-link hs-skip" onClick={onSkip}>بعداً، ورود به حساب</button>}
    </form>
  );
}
