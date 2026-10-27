"use client";
// One customer: what the ledger knows (phone, invoices) beside what the panel keeps (dates, ring size, taste, notes, next follow-up).
import { useState } from "react";
import { Act } from "./Panel";
import { greet, WaIcon } from "./Today";
import { Client, METALS, MONTHS, Person, Store, ago, dayNo, fa, jDate, mdLabel, phoneIntl, toFa, today, toman, waLink } from "@/lib/crm";

const DAY = 864e5;

export default function ClientPage({ c, act }: { c?: Client; st: Store; act: Act }) {
  const [edit, setEdit] = useState(false);
  const [note, setNote] = useState("");
  if (!c) return <div className="pn-page"><p className="pn-empty">این مشتری در دفتر پیدا نشد. <a href="#/clients">برگشت به مشتریان</a></p></div>;
  const { party, person } = c, id = party.id;
  const tel = phoneIntl(party.phone);
  const put = (p: Partial<Person>) => act.person(id, { ...person, ...p });

  const addNote = async () => {
    if (!note.trim()) return;
    await put({ notes: [{ at: new Date().toISOString(), text: note.trim() }, ...(person.notes || [])] });
    setNote("");
  };
  const follow = (days: number | null, text?: string) =>
    put(days == null ? { nextAt: undefined, nextNote: undefined } : { nextAt: new Date(Date.now() + days * DAY).toISOString(), nextNote: text ?? person.nextNote });
  const late = person.nextAt && dayNo(new Date(person.nextAt)) <= today();

  return (
    <div className="pn-page">
      <a className="pn-back" href="#/clients">→ مشتریان</a>
      <div className="pn-card pn-profile">
        <i className="corner c1" /><i className="corner c2" />
        <div className="pn-profile-top">
          <div>
            <h1>{party.name}</h1>
            <p className="pn-profile-sub">{[party.shop, party.kind === "both" ? "مشتری و تأمین‌کننده" : "", party.phone && toFa(party.phone)].filter(Boolean).join("، ") || "شماره‌ای در دفتر نیست"}</p>
            {(person.tags || []).length > 0 && <p className="pn-labels">{person.tags!.map((t) => <i key={t} className="pn-label">{t}</i>)}</p>}
          </div>
          <div className="pn-actions">
            {tel && <a className="btn btn-ink" href={"tel:+" + tel}>تماس</a>}
            {tel && <a className="btn btn-wa" href={waLink(party.phone, `سلام ${party.name} عزیز، از لئون گلد پیام می‌دهیم.`)} target="_blank" rel="noopener"><WaIcon />واتس‌اپ</a>}
          </div>
        </div>
        {/* «حساب من»'s invite page, opened with this person already chosen */}
        <a className="pn-link pn-invite" href={"../hesab/#owner/" + encodeURIComponent(party.id)} style={{ display: "inline-block", marginTop: 8 }}>ساخت لینک ورود به «حساب من» ←</a>
        <dl className="pn-stats">
          <div className="pn-stat-lead"><dt>خرید خرده</dt><dd>{c.spent ? <>{toman(c.spent)}<small> تومان</small></> : "—"}</dd></div>
          <div><dt>وزن کل</dt><dd>{c.grams ? <>{fa(c.grams, 2)}<small> گرم</small></> : "—"}</dd></div>
          <div><dt>فاکتورها</dt><dd>{fa(c.invoices.length)}</dd></div>
          <div><dt>آخرین خرید</dt><dd className="sm">{c.last ? ago(c.last) : "—"}</dd></div>
        </dl>
      </div>

      <div className="pn-cols">
        <div className="pn-card pn-block">
          <h2><i>◆</i>شناخت مشتری{!edit && <button className="pn-link" onClick={() => setEdit(true)}>ویرایش</button>}</h2>
          {edit ? <Profile p={person} onSave={async (p) => { await put(p); setEdit(false); }} onCancel={() => setEdit(false)} /> : (
            <dl className="pn-facts">
              <Fact k="تولد" v={mdLabel(person.birthday)} wa={person.birthday ? waLink(party.phone, greet("birthday", party.name)) : ""} />
              <Fact k="سالگرد ازدواج" v={mdLabel(person.anniversary)} wa={person.anniversary ? waLink(party.phone, greet("anniversary", party.name)) : ""} />
              <Fact k="سایز انگشتر" v={person.ring ? toFa(person.ring) : ""} />
              <Fact k="رنگ طلا" v={person.metal || ""} />
              <Fact k="سلیقه" v={person.likes || ""} wide />
            </dl>
          )}
        </div>

        <div className="pn-card pn-block">
          <h2><i>◆</i>پیگیری بعدی</h2>
          {person.nextAt ? (
            <div className={"pn-next" + (late ? " late" : "")}>
              <b>{late ? "امروز وقتش است" : jDate(person.nextAt)}</b>
              {person.nextNote && <span>{person.nextNote}</span>}
              <button className="pn-link" onClick={() => follow(null)}>انجام شد</button>
            </div>
          ) : <p className="pn-empty">پیگیری‌ای تنظیم نشده.</p>}
          <FollowUp onSet={(d, t) => follow(d, t)} />
        </div>
      </div>

      <div className="pn-card pn-block">
        <h2><i>◆</i>یادداشت‌ها</h2>
        <div className="pn-note-add">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="مثلاً: برای تولد همسرش دنبال گردنبند اسم بود" aria-label="یادداشت تازه" />
          <button className="btn btn-ink" onClick={addNote} disabled={!note.trim()}>ثبت</button>
        </div>
        {(person.notes || []).length ? (
          <ol className="pn-notes">
            {person.notes!.map((n, i) => (
              <li key={n.at + i}><time>{jDate(n.at)}</time><p>{n.text}</p>
                <button className="pn-x" aria-label="حذف یادداشت" onClick={() => confirm("این یادداشت حذف شود؟") && put({ notes: person.notes!.filter((_, j) => j !== i) })}>×</button>
              </li>
            ))}
          </ol>
        ) : <p className="pn-empty">هنوز یادداشتی نیست.</p>}
        {party.note && <p className="pn-ledger-note"><b>یادداشت دفتر:</b> {party.note}</p>}
      </div>

      <div className="pn-card pn-block">
        <h2><i>◆</i>خریدها در دفتر<span className="pn-count">{fa(c.invoices.length)}</span></h2>
        {c.invoices.length ? (
          <ul className="pn-buys">
            {c.invoices.map((i) => (
              <li key={i.id}>
                <div><b>{i.kind === "retail" ? "فاکتور خرده" : "فاکتور عمده"}{i.no ? " " + toFa(String(i.no)) : ""}</b><time>{i.date ? toFa(i.date) : jDate(i.ts)}</time></div>
                <p>{(i.items || []).map((it) => [it.desc, it.weight ? fa(+it.weight, 3) + " گرم" : ""].filter(Boolean).join(" ")).join("، ") || "—"}</p>
                <span className="num">{i.unit === "g" ? fa(+(i.amount || 0), 3) + " گرم" : toman(+(i.amount || 0)) + " تومان"}</span>
              </li>
            ))}
          </ul>
        ) : <p className="pn-empty">در دفتر فاکتوری برای این مشتری نیست.</p>}
      </div>
    </div>
  );
}

function Fact({ k, v, wa, wide }: { k: string; v: string; wa?: string; wide?: boolean }) {
  return (
    <div className={wide ? "wide" : ""}>
      <dt>{k}</dt>
      <dd>{v || <span className="pn-none">نوشته نشده</span>}{wa && <a className="pn-wa sm" href={wa} target="_blank" rel="noopener" aria-label="پیام تبریک"><WaIcon /></a>}</dd>
    </div>
  );
}

function MonthDay({ label, v, set }: { label: string; v?: string; set: (v?: string) => void }) {
  const [m, d] = (v || "").split("-").map(Number);
  const up = (nm?: number, nd?: number) => set(nm && nd ? nm + "-" + nd : undefined);
  return (
    <fieldset className="pn-md">
      <legend>{label}</legend>
      <select value={d || ""} onChange={(e) => up(m || 1, +e.target.value || undefined)} aria-label={label + "، روز"}>
        <option value="">روز</option>
        {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{fa(i + 1)}</option>)}
      </select>
      <select value={m || ""} onChange={(e) => up(+e.target.value || undefined, d || 1)} aria-label={label + "، ماه"}>
        <option value="">ماه</option>
        {MONTHS.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
      </select>
      {v && <button type="button" className="pn-x" onClick={() => set(undefined)} aria-label="پاک کردن">×</button>}
    </fieldset>
  );
}

function Profile({ p, onSave, onCancel }: { p: Person; onSave: (p: Person) => Promise<void>; onCancel: () => void }) {
  const [v, setV] = useState<Person>(p);
  const [tags, setTags] = useState((p.tags || []).join("، "));
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Person) => (x?: string) => setV((o) => ({ ...o, [k]: x || undefined }));
  return (
    <form className="pn-form" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      try { await onSave({ ...v, tags: tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean) }); } catch {}
      setBusy(false);
    }}>
      <MonthDay label="تولد" v={v.birthday} set={set("birthday")} />
      <MonthDay label="سالگرد ازدواج" v={v.anniversary} set={set("anniversary")} />
      <label><span>سایز انگشتر</span><input value={v.ring || ""} onChange={(e) => set("ring")(e.target.value)} inputMode="decimal" /></label>
      <label><span>رنگ طلا</span>
        <select value={v.metal || ""} onChange={(e) => set("metal")(e.target.value)}>
          <option value="">—</option>{METALS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <label className="wide"><span>سلیقه (سبک، سنگ، کارهایی که دوست دارد)</span><textarea rows={2} value={v.likes || ""} onChange={(e) => set("likes")(e.target.value)} /></label>
      <label className="wide"><span>برچسب‌ها (با ویرگول جدا کن، مثلاً: همکار، مشتری ویژه)</span><input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
      <div className="pn-form-end wide">
        <button type="button" className="pn-link" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره"}</button>
      </div>
    </form>
  );
}

function FollowUp({ onSet }: { onSet: (days: number, text: string) => void }) {
  const [t, setT] = useState("");
  const when: [number, string][] = [[1, "فردا"], [3, "سه روز دیگر"], [7, "یک هفته"], [30, "یک ماه"]];
  return (
    <div className="pn-follow">
      <input value={t} onChange={(e) => setT(e.target.value)} placeholder="برای چه؟ مثلاً: رسیدن انگشتر سفارشی" aria-label="موضوع پیگیری" />
      <div className="pn-chips">{when.map(([d, l]) => <button key={d} onClick={() => { onSet(d, t.trim()); setT(""); }}>{l}</button>)}</div>
    </div>
  );
}
