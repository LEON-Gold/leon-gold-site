"use client";
// «دستبند و مدال با اسم» at the top of «لئون کیدز» (owner, 2026-11-14): a name on a bracelet or a medal, in one of the shop's
// designs and colours, or the customer's own; price on request (no number). The request goes to the ledger like the site's
// order form (leon-gold-server /api/public/order → crm_leads, source «سایت»), and Leon calls back. The sample photos are
// the owner's own pieces (made in the LEON KIDS look by the studio tab).
import { useState } from "react";
import { ApiError, publicOrder } from "@/lib/hesab";

const KINDS = ["دستبند", "مدال"], DESIGNS = ["رنگین‌کمان", "موتور", "هواپیما", "هلیکوپتر"], COLORS = ["صورتی", "سبزآبی", "سرمه‌ای", "قرمز"];
const OWN_D = "طرح اختصاصی", OWN_C = "رنگ دیگر";
const toLatin = (s: string) => s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

function Pick({ label, list, value, onPick }: { label: string; list: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <fieldset className="kn-pick"><legend>{label}</legend>
      {list.map(v => <label key={v} className={"kn-chip" + (value === v ? " on" : "")}><input type="radio" name={label} checked={value === v} onChange={() => onPick(v)} />{v}</label>)}
    </fieldset>
  );
}

export default function NameOrder() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ kind: "", text: "", design: "", ownDesign: "", color: "", ownColor: "", name: "", phone: "", note: "", website: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    const phone = toLatin(f.phone).replace(/\D/g, "");
    const miss = !f.kind ? "دستبند یا مدال را انتخاب کنید." : f.text.trim().length < 2 ? "اسمی را که روی کار می‌آید بنویسید." : !f.design ? "یک طرح را انتخاب کنید." :
      f.design === OWN_D && f.ownDesign.trim().length < 3 ? "طرح اختصاصی را چند کلمه توضیح دهید." : !f.color ? "یک رنگ را انتخاب کنید." :
      f.color === OWN_C && !f.ownColor.trim() ? "رنگ دلخواه را بنویسید." : f.name.trim().length < 2 ? "نام خودتان را بنویسید." : phone.length < 10 ? "شماره‌ی تماس کامل نیست." : "";
    if (miss) return setErr(miss);
    setErr(""); setBusy(true);
    const design = f.design === OWN_D ? OWN_D + ": " + f.ownDesign.trim() : f.design, color = f.color === OWN_C ? f.ownColor.trim() : f.color;
    try {
      await publicOrder({ name: f.name.trim(), phone, what: f.kind + " اسم (لئون کیدز)",
        note: ["اسم روی کار: " + f.text.trim(), "طرح: " + design, "رنگ: " + color, f.note.trim()].filter(Boolean).join(" · "), website: f.website });
      setSent(true);
    } catch (x) { setErr(x instanceof ApiError && x.code === "too_many" ? "از این گوشی چند سفارش پشت هم آمده؛ کمی بعد دوباره بفرستید." : "سفارش فرستاده نشد؛ اینترنت را بررسی کنید و دوباره بزنید."); }
    finally { setBusy(false); }
  };
  return (
    <section className="kn" aria-labelledby="kn-h">
      <div className="kn-top">
        <img className="kn-pic" src="/kidsart/name-1.webp" alt="دستبندهای اسم با طرح‌های رنگین‌کمان، موتور، هواپیما و هلیکوپتر" width={720} height={900} />
        <div className="kn-txt">
          <h2 id="kn-h">دستبند و مدال با اسم</h2>
          <p>اسم دلخواه روی دستبند یا مدال، با طرح و رنگی که خودتان انتخاب می‌کنید. اگر طرح اختصاصی دارید، آن را بنویسید؛ پشتیبانی ما با شما تماس می‌گیرد.</p>
          <p className="kn-price">قیمت: با استعلام</p>
          {!open && !sent && <button type="button" className="btn btn-gold" onClick={() => setOpen(true)} aria-expanded={false} aria-controls="kn-form">سفارش با اسم دلخواه</button>}
        </div>
      </div>
      {sent ? <p className="kn-ok" role="status">سفارش شما ثبت شد و به لئون گلد رسید؛ پشتیبانی ما با شما تماس می‌گیرد.</p>
        : open && <form id="kn-form" className="kn-form" onSubmit={send} noValidate>
          <img className="kn-pic2" src="/kidsart/name-2.webp" alt="نمای نزدیک پلاک‌های اسم" width={720} height={900} loading="lazy" />
          <Pick label="چه کاری؟" list={KINDS} value={f.kind} onPick={set("kind")} />
          <label className="kn-field"><span>اسمی که روی کار می‌آید</span><input value={f.text} onChange={e => set("text")(e.target.value)} maxLength={20} placeholder="مثلاً Noura یا نورا" /></label>
          <Pick label="طرح" list={[...DESIGNS, OWN_D]} value={f.design} onPick={set("design")} />
          {f.design === OWN_D && <label className="kn-field"><span>طرح اختصاصی شما (پشتیبانی ما با شما تماس می‌گیرد)</span><input value={f.ownDesign} onChange={e => set("ownDesign")(e.target.value)} maxLength={120} placeholder="مثلاً خرس با بادکنک" /></label>}
          <Pick label="رنگ" list={[...COLORS, OWN_C]} value={f.color} onPick={set("color")} />
          {f.color === OWN_C && <label className="kn-field"><span>رنگ دلخواه</span><input value={f.ownColor} onChange={e => set("ownColor")(e.target.value)} maxLength={40} placeholder="مثلاً یاسی" /></label>}
          <label className="kn-field"><span>نام شما</span><input value={f.name} onChange={e => set("name")(e.target.value)} autoComplete="name" maxLength={60} /></label>
          <label className="kn-field"><span>شماره‌ی تماس</span><input value={f.phone} onChange={e => set("phone")(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" /></label>
          <label className="kn-field"><span>توضیح (اختیاری)</span><textarea value={f.note} onChange={e => set("note")(e.target.value)} rows={2} maxLength={300} /></label>
          <label className="kn-hp" aria-hidden="true"><span>وب‌سایت</span><input value={f.website} onChange={e => set("website")(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
          {err && <p className="kn-err" role="alert">{err}</p>}
          <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "در حال فرستادن…" : "ثبت سفارش"}</button>
        </form>}
    </section>
  );
}
