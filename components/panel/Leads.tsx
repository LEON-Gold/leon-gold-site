"use client";
// «سفارش‌ها»: requests from the site's WhatsApp form, Instagram, the phone or the counter, before they become an invoice.
import { useState } from "react";
import { Act } from "./Panel";
import { WaIcon } from "./Today";
import { COLLECTION } from "@/lib/content";
import { LEAD_STATUS, Lead, LeadStatus, SOURCES, Store, ago, fa, newId, toFa, waLink } from "@/lib/crm";

const ORDER: LeadStatus[] = ["new", "talking", "won", "lost"];

export default function Leads({ st, act }: { st: Store; act: Act }) {
  const [tab, setTab] = useState<LeadStatus>("new");
  const [open, setOpen] = useState<Lead | null>(null);
  const all = Object.values(st.leads).sort((a, b) => (b.upd || b.ts).localeCompare(a.upd || a.ts));
  const n = (s: LeadStatus) => all.filter((l) => l.status === s).length;
  const blank = (): Lead => ({ id: newId("L"), name: "", phone: "", what: COLLECTION[0].name, note: "", source: SOURCES[1], status: "new", ts: new Date().toISOString() });

  return (
    <div className="pn-page">
      <div className="pn-head pn-head-row">
        <div>
          <h1>سفارش‌ها</h1>
          <p>هر درخواستی که هنوز فاکتور نشده: از سایت، واتس‌اپ، اینستاگرام یا حضوری.</p>
        </div>
        <button className="btn btn-gold" onClick={() => setOpen(blank())}>+ سفارش تازه</button>
      </div>
      <div className="pn-chips pn-status" role="tablist">
        {ORDER.map((s) => <button key={s} role="tab" aria-selected={tab === s} onClick={() => setTab(s)}>{LEAD_STATUS[s]}<span>{fa(n(s))}</span></button>)}
      </div>
      <div className="pn-board">
        {ORDER.map((s) => {
          const list = all.filter((l) => l.status === s);
          return (
            <div key={s} className={"pn-card pn-lane" + (tab === s ? " on" : "")}>
              <h2><i>◆</i>{LEAD_STATUS[s]}<span className="pn-count">{fa(list.length)}</span></h2>
              {list.length ? (
                <ul className="pn-leads">
                  {list.map((l) => (
                    <li key={l.id}>
                      <button className="pn-lead" onClick={() => setOpen(l)}>
                        <b>{l.name}</b>
                        <span>{[l.what, l.source].filter(Boolean).join("، ")}</span>
                        {l.note && <p>{l.note}</p>}
                        <time>{ago(l.ts)}</time>
                      </button>
                      {l.phone && <a className="pn-wa" href={waLink(l.phone, `سلام ${l.name} عزیز، از لئون گلد درباره‌ی سفارشتان پیام می‌دهیم.`)} target="_blank" rel="noopener" aria-label={"واتس‌اپ " + l.name}><WaIcon /></a>}
                    </li>
                  ))}
                </ul>
              ) : <p className="pn-empty">{s === "new" ? "سفارش تازه‌ای نیست." : "خالی است."}</p>}
            </div>
          );
        })}
      </div>
      {open && <LeadSheet l={open} isNew={!st.leads[open.id]} act={act} close={() => setOpen(null)} st={st} />}
    </div>
  );
}

function LeadSheet({ l, isNew, act, close, st }: { l: Lead; isNew: boolean; act: Act; close: () => void; st: Store }) {
  const [v, setV] = useState<Lead>(l);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Lead>(k: K, x: Lead[K]) => setV((o) => ({ ...o, [k]: x }));
  const parties = Object.values(st.parties).filter((p) => p.kind !== "supplier").sort((a, b) => a.name.localeCompare(b.name, "fa"));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim()) return setErr("نام را بنویس.");
    setBusy(true);
    try { await act.lead({ ...v, name: v.name.trim(), upd: new Date().toISOString() }); close(); } catch {}
    setBusy(false);
  };
  return (
    <div className="pn-sheet-bg" onClick={(e) => e.target === e.currentTarget && close()}>
      <form className="pn-sheet" onSubmit={submit} role="dialog" aria-modal="true" aria-label={isNew ? "سفارش تازه" : "سفارش"} noValidate
        onKeyDown={(e) => e.key === "Escape" && close()}>
        <h2>{isNew ? "سفارش تازه" : v.name}</h2>
        <div className="pn-form">
          <label><span>نام</span><input value={v.name} onChange={(e) => set("name", e.target.value)} autoFocus={isNew} /></label>
          <label><span>شماره</span><input value={v.phone || ""} onChange={(e) => set("phone", e.target.value)} inputMode="tel" dir="ltr" /></label>
          <label><span>چه کاری</span>
            <select value={v.what} onChange={(e) => set("what", e.target.value)}>
              {COLLECTION.map((c) => <option key={c.name}>{c.name}</option>)}<option>سفارش ساخت</option><option>تعمیر</option>
            </select>
          </label>
          <label><span>از کجا</span>
            <select value={v.source} onChange={(e) => set("source", e.target.value)}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="wide"><span>توضیح (وزن، اندازه، بودجه، موعد)</span><textarea rows={3} value={v.note || ""} onChange={(e) => set("note", e.target.value)} /></label>
          <fieldset className="wide pn-seg">
            <legend>وضعیت</legend>
            {ORDER.map((s) => <button type="button" key={s} aria-pressed={v.status === s} onClick={() => set("status", s)}>{LEAD_STATUS[s]}</button>)}
          </fieldset>
          <label className="wide"><span>مشتریِ دفتر (اگر هست)</span>
            <select value={v.partyId || ""} onChange={(e) => set("partyId", e.target.value || undefined)}>
              <option value="">—</option>{parties.map((p) => <option key={p.id} value={p.id}>{p.name}{p.phone ? "، " + toFa(p.phone) : ""}</option>)}
            </select>
          </label>
        </div>
        {err && <p className="pn-err" role="alert">{err}</p>}
        <div className="pn-form-end">
          {!isNew && <button type="button" className="pn-link danger" onClick={async () => { if (confirm("این سفارش حذف شود؟")) { await act.lead(null, v.id); close(); } }}>حذف</button>}
          {v.partyId && <a className="pn-link" href={`#/c/${encodeURIComponent(v.partyId)}`}>صفحه‌ی مشتری</a>}
          <span className="pn-gap" />
          <button type="button" className="pn-link" onClick={close}>انصراف</button>
          <button className="btn btn-gold" disabled={busy}>{busy ? "…" : "ذخیره"}</button>
        </div>
      </form>
    </div>
  );
}
