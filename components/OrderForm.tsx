"use client";
// Order request (owner, 2026-11-14): it goes straight to the ledger (leon-gold-server /api/public/order → crm_leads, source
// «سایت»), which shows it on its home page and tells the owner at once. Only if that fails (no connection) is the old way
// offered: the request is copied and the shop's Telegram opens (Telegram cannot fill in a message to a person).
import { useState } from "react";
import { COLLECTION, SHOP } from "@/lib/content";
import { ApiError, publicOrder } from "@/lib/hesab";

export default function OrderForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [what, setWhat] = useState(COLLECTION[0].name);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [website, setWebsite] = useState(""); // only a robot fills this (it is hidden)

  const text = () => `سفارش از سایت لئون گلد\nنام: ${name.trim()}\nتلفن: ${phone.trim()}\nکار: ${what}${note.trim() ? "\nتوضیح: " + note.trim() : ""}`;
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const digits = phone.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/\D/g, "");
    if (!name.trim()) return setErr("اسمت را بنویس.");
    if (digits.length < 10) return setErr("شماره‌ی تماس کامل نیست.");
    setErr(""); setFailed(false); setBusy(true);
    try {
      await publicOrder({ name: name.trim(), phone: digits, what, note: note.trim(), website });
      setSent(true);
    } catch (x) {
      if (x instanceof ApiError && x.code === "too_many") setErr("امروز چند سفارش از همین‌جا فرستاده شده؛ کمی بعد دوباره بفرست یا در تلگرام بنویس.");
      else if (x instanceof ApiError && (x.code === "bad_name" || x.code === "bad_phone")) setErr(x.code === "bad_name" ? "اسمت را بنویس." : "شماره‌ی تماس کامل نیست.");
      setFailed(true);
    } finally { setBusy(false); }
  };
  // the old way, only when sending failed: opened now, while the tap still counts (Safari blocks a window opened after an await)
  const viaTelegram = () => { window.open(SHOP.telegram, "_blank", "noopener"); navigator.clipboard?.writeText(text()).catch(() => {}); };

  if (sent) return (
    <div className="order-form order-done" role="status">
      <p className="order-ok">سفارشت ثبت شد و به لئون گلد رسید؛ در ساعت کاری تماس می‌گیریم.</p>
      <button className="btn btn-line" type="button" onClick={() => { setSent(false); setNote(""); }}>سفارش دیگر</button>
    </div>
  );

  return (
    <form className="order-form" onSubmit={send} noValidate>
      <label><span>نام</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
      <label><span>شماره‌ی تماس</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" required /></label>
      <label><span>چه کاری؟</span>
        <select value={what} onChange={(e) => setWhat(e.target.value)}>
          {COLLECTION.map((c) => <option key={c.name}>{c.name}</option>)}
          <option>سفارش ساخت</option>
        </select>
      </label>
      <label className="wide"><span>توضیح (وزن تقریبی، اندازه، بودجه)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></label>
      {err && !failed && <p className="order-err" role="alert">{err}</p>}
      <label className="order-hp" aria-hidden="true"><span>وب‌سایت</span><input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
      {failed && <p className="order-err" role="alert">{err || "سفارش فرستاده نشد؛ اینترنت را بررسی کن و دوباره بزن."} <button className="btn-text" type="button" onClick={viaTelegram}>یا در تلگرام بفرست</button> (متن سفارش کپی می‌شود).</p>}
      <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "در حال فرستادن…" : "ثبت سفارش"}</button>
    </form>
  );
}
