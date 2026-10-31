"use client";
// Order request. Until the CRM panel's API exists, it goes to the shop's Telegram so nothing is lost. Telegram cannot
// fill in a message to a person, so the request is copied first and the visitor pastes it into the chat.
import { useState } from "react";
import { COLLECTION, SHOP } from "@/lib/content";

export default function OrderForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [what, setWhat] = useState(COLLECTION[0].name);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/\D/g, "");
    if (!name.trim()) return setErr("اسمت را بنویس.");
    if (digits.length < 10) return setErr("شماره‌ی تماس کامل نیست.");
    setErr("");
    const text = `سفارش از سایت لئون گلد\nنام: ${name.trim()}\nتلفن: ${phone.trim()}\nکار: ${what}${note.trim() ? "\nتوضیح: " + note.trim() : ""}`;
    // opened now, while the tap still counts (Safari blocks a window opened after an await)
    window.open(SHOP.telegram, "_blank", "noopener");
    navigator.clipboard?.writeText(text).catch(() => {});
    setSent(true);
  };

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
      {err && <p className="order-err" role="alert">{err}</p>}
      {sent && <p className="order-ok" role="status">متن سفارش کپی شد. در گفت‌وگوی تلگرام لئون گلد که باز شد، آن را بچسبانید و بفرستید.</p>}
      <button className="btn btn-gold" type="submit">فرستادن سفارش در تلگرام</button>
    </form>
  );
}
