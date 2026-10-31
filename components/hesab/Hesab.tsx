"use client";
// «حساب من»: sign-in (SMS code or the owner's one-time link), then the party's assay slip (gold and rial balance),
// their orders (customers), the work given to them (suppliers) and the statement, newest first.
import { useCallback, useEffect, useMemo, useState } from "react";
import { SHOP } from "@/lib/content";
import Door from "@/components/Door";
import {
  ApiError, SAMPLE, dayNum, faDigits, getToken, gram, jdate, jtime, latin, logout, me, photoUrl, redeem, rial, sendReceipt, shrinkPhoto, side, startSms, today, toman, verifySms,
  type Account, type Entry, type Me,
} from "@/lib/hesab";

type Role = "customer" | "supplier";
type Phase = "boot" | "phone" | "code" | "in";
const ERR: Record<string, string> = {
  bad_phone: "شماره‌ی موبایل درست نیست. مثل ۰۹۱۲۱۲۳۴۵۶۷ بنویسید.",
  too_many: "چند بار پشت سر هم امتحان شد. چند دقیقه‌ی دیگر دوباره بزنید.",
  expired: "این کد دیگر کار نمی‌کند. یک کد تازه بگیرید.",
  sms_failed: "پیامک فرستاده نشد. چند لحظه‌ی دیگر دوباره بزنید.",
  offline: "به سرور وصل نشدیم. اینترنت را بررسی کنید و دوباره بزنید.",
  no_account: "این شماره هنوز در دفتر لئون گلد حسابی ندارد. از طریق واتس‌اپ به ما خبر بدهید.",
  login: "ورودتان تمام شده. دوباره وارد شوید.",
  bad_type: "این فایل عکس نیست. یک عکس از رسید را انتخاب کن.",
  too_large: "عکس خیلی بزرگ است. عکس کوچک‌تری انتخاب کن یا دوباره از دوربین بگیر.",
};
const errText = (e: unknown) => {
  if (e instanceof ApiError) {
    if (e.code === "bad_code") { const n = Number(e.extra.left); return n > 0 ? `کد درست نیست. ${faDigits(n)} بار دیگر می‌توانید امتحان کنید.` : ERR.expired; }
    return ERR[e.code] || "مشکلی پیش آمد. دوباره امتحان کنید.";
  }
  return "مشکلی پیش آمد. دوباره امتحان کنید.";
};
const wa = (text: string) => SHOP.whatsapp + "?text=" + encodeURIComponent(text);
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
  const [role, setRole] = useState<Role>("customer");
  const [data, setData] = useState<Me | null>(null);
  const [smsOff, setSmsOff] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { setData(await me()); setPhase("in"); }
    catch (e) { setErr(e instanceof ApiError && e.status === 401 ? "" : errText(e)); setPhase("phone"); }
  }, []);

  useEffect(() => {
    const h = location.hash, k = /[#&]k=([\w-]+)/.exec(h)?.[1];
    // the link's key is used once, so it leaves the address bar (and the history) straight away
    if (k) history.replaceState(null, "", location.pathname);
    (async () => {
      if (h === "#demo") { setData(SAMPLE); setPhase("in"); return; }
      if (k) {
        try { await redeem(k); }
        catch (e) { setErr(e instanceof ApiError && e.code === "expired" ? "این لینک ورود قبلاً استفاده شده یا وقتش گذشته. لینک تازه را از لئون گلد بخواهید." : errText(e)); setPhase("phone"); return; }
      }
      if (k || getToken()) await load(); else setPhase("phone");
    })();
  }, [load]);

  const out = async () => { if (!data?.demo) await logout(); if (location.hash) history.replaceState(null, "", location.pathname); setData(null); setErr(""); setPhase("phone"); };
  const demo = () => { history.replaceState(null, "", "#demo"); setData(SAMPLE); setPhase("in"); };

  if (phase === "in" && data) return <Panel data={data} role={role} onOut={out} onReload={data.demo ? undefined : load} />;
  return (
    <Door name="حساب من" latin="LEON GOLD · MY ACCOUNT" fine="فقط حساب خودتان را می‌بینید و در این صفحه چیزی تغییر نمی‌کند.">
        <div className="hs-seg" role="radiogroup" aria-label="شما">
          {(["customer", "supplier"] as Role[]).map(r => (
            <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}>{r === "customer" ? "مشتری هستم" : "تأمین‌کننده هستم"}</button>
          ))}
        </div>
        <p className="hs-lede">{role === "customer"
          ? "مانده‌ی حساب طلایی و ریالی، فاکتورها و وضعیت سفارش‌هایتان، همان که در دفتر لئون ثبت شده."
          : "مانده‌ی حساب طلایی‌تان با لئون، سندهای تحویل و کارهایی که به شما سپرده شده، به ترتیب موعد."}</p>
        {phase === "boot" ? <p className="hs-wait" aria-live="polite">در حال باز کردن…</p>
          : smsOff ? <SmsOff role={role} />
          : <SignIn role={role} phase={phase} setPhase={setPhase} err={err} setErr={setErr} onSmsOff={() => setSmsOff(true)} onIn={load} />}
        <button type="button" className="hs-demo" onClick={demo}>دیدن نمونه‌ی پنل</button>
    </Door>
  );
}

function SmsOff({ role }: { role: Role }) {
  return (
    <div className="hs-note" role="status">
      <p>ورود با پیامک به‌زودی فعال می‌شود. تا آن موقع لینک ورود را از ما بخواهید؛ با همان لینک وارد حسابتان می‌شوید.</p>
      <a className="btn btn-gold hs-wide" href={wa(role === "customer" ? "سلام، لطفاً لینک ورود به «حساب من» را برایم بفرستید." : "سلام، تأمین‌کننده‌ی لئون هستم؛ لطفاً لینک ورود به «حساب من» را بفرستید.")} target="_blank" rel="noopener">درخواست لینک در واتس‌اپ</a>
    </div>
  );
}

function SignIn({ role, phase, setPhase, err, setErr, onSmsOff, onIn }: {
  role: Role; phase: Phase; setPhase: (p: Phase) => void; err: string; setErr: (s: string) => void; onSmsOff: () => void; onIn: () => Promise<void>;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(w => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault(); if (busy) return;
    setBusy(true); setErr("");
    try { const r = await startSms(phone); setWait(r.wait); setCode(""); setPhase("code"); }
    catch (x) { if (x instanceof ApiError && x.code === "sms_off") onSmsOff(); else setErr(errText(x)); }
    finally { setBusy(false); }
  };
  const check = async (c = code) => {
    if (busy || latin(c).replace(/\D/g, "").length !== 5) return;
    setBusy(true); setErr("");
    try { await verifySms(phone, c); await onIn(); }
    catch (x) { setErr(errText(x)); setCode(""); }
    finally { setBusy(false); }
  };

  if (phase === "code") return (
    <form className="hs-form" onSubmit={e => { e.preventDefault(); check(); }}>
      <p className="hs-sent">اگر <b className="num" dir="ltr">{faDigits(latin(phone))}</b> در دفتر لئون ثبت باشد، یک کد پنج‌رقمی برایش پیامک شد.</p>
      <label className="hs-field"><span>کد پیامک</span>
        <input className="num hs-code" value={code} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={5} dir="ltr" aria-describedby={err ? "hs-err" : undefined}
          onChange={e => { const v = latin(e.target.value).replace(/\D/g, "").slice(0, 5); setCode(v); if (v.length === 5) check(v); }} />
      </label>
      {err && <p className="hs-err" id="hs-err" role="alert">{err}</p>}
      <button className="btn btn-gold hs-wide" disabled={busy || code.length !== 5}>{busy ? "در حال بررسی…" : "ورود"}</button>
      <div className="hs-row">
        <button type="button" className="hs-link" onClick={() => { setPhase("phone"); setErr(""); }}>شماره را عوض کنید</button>
        <button type="button" className="hs-link" disabled={wait > 0 || busy} onClick={() => send()}>{wait > 0 ? `ارسال دوباره تا ${faDigits(wait)} ثانیه` : "ارسال دوباره‌ی کد"}</button>
      </div>
    </form>
  );
  return (
    <form className="hs-form" onSubmit={send}>
      <label className="hs-field"><span>{role === "customer" ? "شماره‌ی موبایلی که به لئون داده‌اید" : "شماره‌ی موبایل کارگاه یا فروشگاه"}</span>
        <input className="num" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷" inputMode="tel" autoComplete="tel" dir="ltr" required aria-describedby={err ? "hs-err" : undefined} />
      </label>
      {err && <p className="hs-err" id="hs-err" role="alert">{err}</p>}
      <button className="btn btn-gold hs-wide" disabled={busy}>{busy ? "در حال ارسال…" : "دریافت کد ورود"}</button>
    </form>
  );
}

// ---------------- signed in ----------------
const KIND: Record<Account["kind"], string> = { customer: "مشتری", supplier: "تأمین‌کننده", both: "مشتری و تأمین‌کننده" };

function Panel({ data, role, onOut, onReload }: { data: Me; role: Role; onOut: () => void; onReload?: () => void }) {
  const [ai, setAi] = useState(0);
  const a = data.accounts[Math.min(ai, data.accounts.length - 1)];
  const isCustomer = a.kind !== "supplier", isSupplier = a.kind !== "customer";
  // for a party that is both, the side they picked at the door comes first
  const supplierFirst = isSupplier && (!isCustomer || role === "supplier");
  const blocks = [isCustomer && <Orders key="o" a={a} />, isSupplier && <WorkList key="w" a={a} />].filter(Boolean);
  if (supplierFirst) blocks.reverse();

  return (
    <div className="hs-app">
      <header className="hs-bar">
        <a className="hs-brand" href="../"><img src="/leaf.png" alt="" width={28} height={28} /><span className="leaf">لئون گلد</span></a>
        <span className="hs-bar-t">حساب من</span>
        <button type="button" className="hs-out" onClick={onOut}>{data.demo ? "بستن نمونه" : "خروج"}</button>
      </header>
      {data.demo && <p className="hs-demo-band" role="note">این یک حساب نمونه است، با رقم‌های ساختگی؛ فقط برای دیدن شکل پنل.</p>}
      <main className="hs-main">
        <div className="hs-who">
          <h1>{a.name}</h1>
          <p>{a.shop ? a.shop + " · " : ""}<span className="hs-kind">{KIND[a.kind]}</span></p>
          {data.accounts.length > 1 && (
            <div className="hs-seg hs-acc" role="tablist" aria-label="حساب‌ها">
              {data.accounts.map((x, i) => <button key={x.id} type="button" role="tab" aria-selected={i === ai} onClick={() => setAi(i)}>{x.shop || x.name}</button>)}
            </div>
          )}
        </div>
        <Slip a={a} />
        {isCustomer && !data.demo && <ReceiptUpload />}
        {blocks}
        <Statement ent={a.ent} />
        <footer className="hs-foot">
          <p>{data.updated ? `آخرین ثبت در دفتر: ${jdate(data.updated)}، ساعت ${jtime(data.updated)}` : ""}{onReload && <> · <button type="button" className="hs-link" onClick={onReload}>تازه کردن</button></>}</p>
          <p>رقمی با حساب شما نمی‌خواند؟ <a href={wa(`سلام، درباره‌ی حسابم در «حساب من» سؤال دارم (${a.name}).`)} target="_blank" rel="noopener">در واتس‌اپ بگویید</a>؛ اشتباه از طرفین قابل برگشت است.</p>
        </footer>
      </main>
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
        <a className="hs-link" href={wa(`سلام، ${a.name} هستم؛ می‌خواهم یک سفارش ساخت ثبت کنم.`)} target="_blank" rel="noopener">سفارش تازه</a>
      </div>
      {!a.orders.length ? <p className="hs-empty">هنوز سفارشی برایتان ثبت نشده. هر وقت سفارش ساخت بدهید، مرحله‌به‌مرحله همین‌جا دیده می‌شود.</p> : (
        <ul className="hs-list">
          {shown.map(o => (
            <li key={o.ref} className="hs-item paper">
              <div className="hs-item-top">
                <b>{o.items.map(i => i.desc).filter(Boolean).join("، ") || "سفارش"}</b>
                <span className="num hs-ref">#{o.ref}</span>
              </div>
              <p className="hs-meta">{[o.date && "ثبت " + o.date, o.due && "موعد " + o.due, o.deposit ? "بیعانه " + toman(o.deposit) + " تومان" : ""].filter(Boolean).join(" · ")}
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
                <a className="btn btn-ink hs-ready" href={wa(`سلام، ${a.name} هستم. کار #${w.ref} (${w.desc}${w.weight ? "، " + gram(w.weight) + " گرم" : ""}) آماده‌ی تحویل است.`)} target="_blank" rel="noopener">اعلام آماده بودن</a>
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
function ReceiptUpload() {
  const [open, setOpen] = useState(false);
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
    try {
      const dataUrl = await shrinkPhoto(file);
      const toman1 = latin(amount).replace(/\D/g, "");
      await sendReceipt(dataUrl, toman1 ? +toman1 * 10 : undefined, date.trim() || undefined);
      setSent(true); pick(null); setAmount(""); setDate("");
    } catch (x) { setErr(errText(x)); }
    finally { setBusy(false); }
  };

  if (!open) return (
    <button type="button" className="btn btn-ink hs-receipt-open" onClick={() => { setOpen(true); setSent(false); }}>ارسال رسید کارت‌به‌کارت</button>
  );
  return (
    <section className="hs-sec hs-receipt paper" aria-label="ارسال رسید کارت‌به‌کارت">
      <Corners />
      <h2 className="hs-h">رسید کارت‌به‌کارت</h2>
      {sent ? (
        <>
          <p className="hs-sent">رسید فرستاده شد؛ لئون آن را می‌بیند و بعد از ثبت سند واقعی در دفتر، حسابتان به‌روز می‌شود.</p>
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

function Statement({ ent }: { ent: Entry[] }) {
  const [u, setU] = useState<"all" | "g" | "r">("all");
  const [n, setN] = useState(20);
  const rows = useMemo(() => ent.filter(e => u === "all" || e.u === u), [ent, u]);
  const amt = (e: Entry, v: number) => (e.u === "g" ? gram(v) + " گرم" : rial(v) + " ریال");
  return (
    <section className="hs-sec" aria-labelledby="hs-s">
      <div className="hs-sec-head">
        <h2 className="hs-h" id="hs-s">صورتحساب</h2>
        <div className="hs-seg hs-mini" role="radiogroup" aria-label="کدام حساب">
          {([["all", "همه"], ["g", "طلایی"], ["r", "ریالی"]] as const).map(([k, t]) => <button key={k} type="button" role="radio" aria-checked={u === k} onClick={() => { setU(k); setN(20); }}>{t}</button>)}
        </div>
      </div>
      {!rows.length ? <p className="hs-empty">هنوز سندی ثبت نشده.</p> : (
        <ol className="hs-stmt paper">
          {rows.slice(0, n).map((e, i) => {
            const body = (
              <>
                <span className="hs-st-d num">{e.date || jdate(e.ts)}</span>
                <span className="hs-st-l">{faDigits(e.label)}</span>
                <span className={"hs-st-a num " + side(e.d, e.u)}><bdi>{({ cr: "−", dr: "+", z: "" } as const)[side(e.d, e.u)]}{e.u === "g" ? gram(e.d) : rial(e.d)}</bdi><small>{e.u === "g" ? "گرم" : "ریال"}</small></span>
                <span className="hs-st-r num">مانده {amt(e, e.run)} <em>{side(e.run, e.u) === "z" ? "تسویه" : side(e.run, e.u) === "dr" ? "بدهکار" : "بستانکار"}</em></span>
              </>
            );
            return (
              <li key={e.ts + e.label + i}>
                {e.lines?.length ? (
                  <details><summary>{body}</summary>
                    <ul className="hs-lines">{e.lines.map((l, k) => <li key={k}><span>{l.ret ? "برگشتی: " : ""}{l.desc}</span><span className="num">{spec(l)}{l.amount ? " · " + toman(l.amount) + " تومان" : l.totalG ? " · " + gram(l.totalG) + " گرم ۷۵۰" : ""}</span></li>)}</ul>
                  </details>
                ) : <div className="hs-st-row">{body}</div>}
              </li>
            );
          })}
        </ol>
      )}
      {rows.length > n && <button type="button" className="hs-link hs-more" onClick={() => setN(n + 40)}>سندهای قدیمی‌تر</button>}
      <p className="hs-legend"><b className="dr">+</b> بر بدهی شما افزود · <b className="cr">−</b> از آن کم کرد (یا بر طلبتان افزود)</p>
    </section>
  );
}
