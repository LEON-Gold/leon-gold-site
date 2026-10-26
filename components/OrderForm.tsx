"use client";
// Order request. Until the CRM panel's API exists, it hands the filled request to WhatsApp so nothing is lost.
import { useState } from "react";
import { COLLECTION, SHOP } from "@/lib/content";

export default function OrderForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [what, setWhat] = useState(COLLECTION[0].name);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/\D/g, "");
    if (!name.trim()) return setErr("اسمت را بنویس.");
    if (digits.length < 10) return setErr("شماره‌ی تماس کامل نیست.");
    setErr("");
    const text = `سفارش از سایت لئون گلد\nنام: ${name.trim()}\nتلفن: ${phone.trim()}\nکار: ${what}${note.trim() ? "\nتوضیح: " + note.trim() : ""}`;
    window.open(SHOP.whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  };

  return (
    <form className="order" onSubmit={send} noValidate>
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
      <button className="btn" type="submit">ثبت سفارش</button>
    </form>
  );
}
