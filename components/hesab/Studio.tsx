"use client";
// «محصولات من» for a supplier the owner allows (owner, 2026-11-10): it adds and edits only its own pieces, with photos,
// a film, weight, karat, its own wage and how many it has. What it sends waits in the ledger as «در انتظار بررسی»
// and nobody sees it until Leon sets the price and shows it. It never sees anyone else's pieces, nor Leon's wage or price.
import { useEffect, useState } from "react";
import { ApiError, faDigits, gram, latin, mediaUrl, shrinkPhoto, studioCat, studioMedia, studioRemove, studioSave, vitrin, VCATS_DEFAULT, VGROUPS_DEFAULT, type VCat, type VGroup, type VItem } from "@/lib/hesab";
import Loader from "@/components/Loader";

type M = { id: string; type: "image" | "video"; local?: string };
type Draft = { id?: string; name: string; cat: string; groups: string[]; weight: string; carat: string; supAjrat: string; qty: string; desc: string; media: M[] };
const EMPTY: Draft = { name: "", cat: "", groups: [], weight: "", carat: "750", supAjrat: "", qty: "0", desc: "", media: [] };
const NEW_CAT = "__new__";
const ST: Record<string, [string, string]> = { pending: ["در انتظار بررسی لئون", "wait"], live: ["در ویترین لئون", "live"], hidden: ["پنهان", "off"] };
const VIDEO_MAX = 40 * 1024 * 1024;
const ERR: Record<string, string> = { no_photo: "دست‌کم یک عکس بگذارید.", bad_name: "نام کار را بنویسید.", bad_weight: "وزن را به گرم بنویسید (مثلاً ۴٫۲).", too_large: "این فایل خیلی بزرگ است.", bad_type: "این فایل عکس یا فیلم نیست.", too_many: "امروز خیلی زیاد فرستادید؛ فردا دوباره امتحان کنید.", no_upload: "لئون هنوز اجازه‌ی فرستادن محصول را برای شما روشن نکرده.", too_many_cats: "پنج کتگوری تازه‌ی شما هنوز منتظر تأیید لئون است؛ بعد از تأیید، کتگوری دیگری بسازید.", offline: "به سرور وصل نشد؛ اینترنت را بررسی کنید." };
const errText = (x: unknown) => x instanceof ApiError ? ERR[x.code] || "انجام نشد؛ دوباره امتحان کنید." : "انجام نشد؛ دوباره امتحان کنید.";
const asData = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });

function Pic({ m, className }: { m: M; className?: string }) {
  const [u, setU] = useState<string | null>(m.local || null);
  useEffect(() => { if (m.local) return; let dead = false, url = ""; mediaUrl(m.id).then(x => { url = x; if (!dead) setU(x); }).catch(() => {}); return () => { dead = true; if (url) URL.revokeObjectURL(url); }; }, [m.id, m.local]);
  if (!u) return <span className={(className || "") + " hs-st-ph"} aria-hidden />;
  return m.type === "video" ? <video className={className} src={u} muted playsInline preload="metadata" /> : <img className={className} src={u} alt="" />;
}

export default function Studio({ demo }: { demo?: boolean }) {
  const [items, setItems] = useState<VItem[] | null>(null);
  const [d, setD] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(""), [err, setErr] = useState(""), [done, setDone] = useState(""), [ask, setAsk] = useState(false);
  // the owner's categories and groups (owner, 2026-11-13), and the categories this supplier asked for that still wait for Leon
  const [cats, setCats] = useState<VCat[]>(VCATS_DEFAULT), [groups, setGroups] = useState<VGroup[]>(VGROUPS_DEFAULT), [myCats, setMyCats] = useState<string[]>([]);
  const [newCat, setNewCat] = useState<string | null>(null), [catMsg, setCatMsg] = useState("");
  const load = () => (demo ? Promise.resolve({ mine: [] as VItem[], cats: VCATS_DEFAULT, groups: VGROUPS_DEFAULT, myCats: [] as string[] }) : vitrin())
    .then(r => { setItems(r.mine); setCats(r.cats); setGroups(r.groups); setMyCats(r.myCats); }, () => setItems([]));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setD(x => x && { ...x, [k]: e.target.value });
  const open = (it?: VItem) => { setErr(""); setDone(""); setAsk(false); setNewCat(null); setCatMsg(""); setD(it ? { id: it.id, name: it.name, cat: it.cat, groups: groups.filter(g => it.tags?.includes(g.name)).map(g => g.k), weight: String(it.weight || ""), carat: String(it.carat || 750), supAjrat: it.supAjrat == null ? "" : String(it.supAjrat), qty: String(it.qty || 0), desc: it.desc || "", media: it.media.map(m => ({ ...m })) } : { ...EMPTY }); scrollTo({ top: 0 }); };
  // photos are made small here before they go up; a film goes as it is (up to 40 MB)
  const add = async (e: React.ChangeEvent<HTMLInputElement>, video: boolean) => {
    const input = e.target, files = Array.from(input.files || []); if (!files.length || !d) return;
    setErr("");
    for (let i = 0; i < files.length; i++) {
      const f = files[i]; setBusy(video ? "در حال فرستادن فیلم…" : `در حال فرستادن عکس ${faDigits(i + 1)} از ${faDigits(files.length)}…`);
      try {
        if (video && f.size > VIDEO_MAX) { setErr("فیلم باید کمتر از ۴۰ مگابایت باشد."); continue; }
        const data = video ? await asData(f) : await shrinkPhoto(f, 1600, .86), local = video ? URL.createObjectURL(f) : data;
        const m = demo ? { id: "demo" + Date.now() + i, type: (video ? "video" : "image") as M["type"] } : await studioMedia(data);
        setD(x => x && { ...x, media: [...x.media, { id: m.id, type: m.type, local }].slice(0, 12) });
      } catch (x) { setErr(errText(x)); }
    }
    setBusy(""); input.value = "";
  };
  const ask4cat = async () => {
    const name = (newCat || "").replace(/\s+/g, " ").trim(); if (name.length < 2) return setCatMsg("نام کتگوری را بنویسید.");
    setCatMsg("");
    try {
      const r = demo ? { ok: true as const, cat: name, pending: true } : await studioCat(name);
      if (r.pending && !myCats.includes(r.cat)) setMyCats([...myCats, r.cat]);
      setD(x => x && { ...x, cat: r.cat }); setNewCat(null);
      setCatMsg(r.exists ? `«${r.cat}» از قبل بود؛ همان انتخاب شد.` : `«${r.cat}» فرستاده شد؛ تا تأیید لئون فقط شما آن را می‌بینید.`);
    } catch (x) { setCatMsg(errText(x)); }
  };
  const togG = (k: string) => setD(x => x && { ...x, groups: x.groups.includes(k) ? x.groups.filter(g => g !== k) : [...x.groups, k] });
  const save = async () => {
    if (!d) return; setErr("");
    if (d.name.trim().length < 2) return setErr(ERR.bad_name);
    if (!(+latin(d.weight).replace(/[٫/]/g, ".") > 0)) return setErr(ERR.bad_weight);
    if (!d.media.some(m => m.type === "image")) return setErr(ERR.no_photo);
    setBusy("در حال ذخیره…");
    try {
      if (!demo) await studioSave({ id: d.id, name: d.name.trim(), cat: d.cat, groups: d.groups, weight: latin(d.weight), carat: +d.carat || 750, supAjrat: latin(d.supAjrat), qty: latin(d.qty), desc: d.desc.trim(), media: d.media.map(m => ({ id: m.id, type: m.type })) });
      setDone(d.id ? "ویرایش فرستاده شد؛ لئون آن را بررسی می‌کند." : "کار تازه فرستاده شد؛ بعد از بررسی و قیمت‌گذاری لئون در ویترین دیده می‌شود.");
      setD(null); await load();
    } catch (x) { setErr(errText(x)); } finally { setBusy(""); }
  };
  const remove = async () => {
    if (!d?.id) return; setBusy("در حال برداشتن…");
    try { if (!demo) await studioRemove(d.id); setDone("برداشته شد."); setD(null); await load(); } catch (x) { setErr(errText(x)); } finally { setBusy(""); setAsk(false); }
  };

  if (d) return (
    <section className="hs-sec hs-studio" aria-labelledby="hs-st-h">
      <button type="button" className="hs-link hs-prod-back" onClick={() => setD(null)}>→ محصولات من</button>
      <h1 className="hs-h" id="hs-st-h">{d.id ? "ویرایش کار" : "کار تازه برای ویترین لئون"}</h1>
      <p className="hs-prof-fine">بعد از ذخیره، لئون آن را بررسی و قیمت‌گذاری می‌کند؛ تا آن موقع کسی آن را نمی‌بیند.</p>
      <div className="hs-st-media paper">
        <div className="hs-st-thumbs">
          {d.media.map((m, i) => (
            <div key={m.id} className="hs-st-th"><Pic m={m} className="hs-st-img" />{m.type === "video" && <i className="hs-vplay">▶</i>}{i === 0 && <em>روی کارت</em>}
              <button type="button" aria-label="برداشتن" onClick={() => setD(x => x && { ...x, media: x.media.filter(y => y.id !== m.id) })}>×</button></div>
          ))}
        </div>
        <div className="hs-st-add">
          <label className="btn btn-gold">+ عکس<input type="file" accept="image/*" multiple hidden onChange={e => add(e, false)} disabled={!!busy} /></label>
          <label className="btn btn-line">+ فیلم<input type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={e => add(e, true)} disabled={!!busy} /></label>
        </div>
        <p className="hs-prof-fine">اولین عکس روی کارت می‌آید. تا ۱۲ عکس و فیلم؛ فیلم تا ۴۰ مگابایت.</p>
      </div>
      <div className="hs-form hs-st-form">
        <label className="hs-field"><span>نام کار *</span><input value={d.name} onChange={set("name")} maxLength={80} placeholder="مثلاً النگو طرح برگ" /></label>
        {groups.length > 0 && <fieldset className="hs-st-groups"><legend>گروه <small>(هر چند تا که می‌خورد)</small></legend>
          {groups.map(g => <label key={g.k} className={"hs-st-g" + (d.groups.includes(g.k) ? " on" : "")}><input type="checkbox" checked={d.groups.includes(g.k)} onChange={() => togG(g.k)} />{g.name}</label>)}
        </fieldset>}
        <label className="hs-field"><span>دسته</span><select className="hs-select" value={newCat != null ? NEW_CAT : d.cat} onChange={e => { setCatMsg(""); if (e.target.value === NEW_CAT) setNewCat(""); else { setNewCat(null); set("cat")(e); } }}>
          <option value="">— انتخاب کنید —</option>
          {cats.map(c => <option key={c.k} value={c.name}>{c.name}</option>)}
          {myCats.filter(c => !cats.some(x => x.name === c)).map(c => <option key={"m" + c} value={c}>{c} (منتظر تأیید لئون)</option>)}
          {d.cat && !cats.some(x => x.name === d.cat) && !myCats.includes(d.cat) && <option value={d.cat}>{d.cat}</option>}
          <option value={NEW_CAT}>+ کتگوری تازه…</option>
        </select></label>
        {newCat != null && <div className="hs-st-newcat">
          <label className="hs-field"><span>نام کتگوری تازه</span><input value={newCat} onChange={e => setNewCat(e.target.value)} maxLength={24} placeholder="مثلاً حلقه‌ی ازدواج" autoFocus /></label>
          <button type="button" className="btn btn-line" onClick={ask4cat}>ساختن</button>
          <p className="hs-prof-fine">کتگوری تازه بعد از تأیید لئون برای همه دیده می‌شود؛ تا آن موقع فقط شما آن را می‌بینید.</p>
        </div>}
        {catMsg && <p className="hs-sent" role="status">{catMsg}</p>}
        <div className="hs-st-row">
          <label className="hs-field"><span>وزن (گرم) *</span><input value={d.weight} onChange={set("weight")} inputMode="decimal" dir="ltr" placeholder="۴٫۲" /></label>
          <label className="hs-field"><span>عیار</span><select className="hs-select" value={d.carat} onChange={set("carat")}><option value="750">۱۸ (۷۵۰)</option><option value="875">۲۱ (۸۷۵)</option><option value="999">۲۴ (۹۹۹)</option><option value="585">۱۴ (۵۸۵)</option></select></label>
        </div>
        <div className="hs-st-row">
          <label className="hs-field"><span>اجرت شما (٪)</span><input value={d.supAjrat} onChange={set("supAjrat")} inputMode="decimal" dir="ltr" placeholder="۶" /></label>
          <label className="hs-field"><span>تعداد آماده (۰ = سفارشی)</span><input value={d.qty} onChange={set("qty")} inputMode="numeric" dir="ltr" /></label>
        </div>
        <label className="hs-field"><span>توضیح</span><textarea value={d.desc} onChange={set("desc")} rows={3} maxLength={600} placeholder="سنگ، اندازه، جنس زنجیر…" /></label>
        {err && <p className="hs-err" role="alert">{err}</p>}
        {busy && <p className="hs-sent" aria-live="polite">{busy}</p>}
        <button type="button" className="btn btn-gold hs-wide" disabled={!!busy} onClick={save}>{d.id ? "فرستادن ویرایش" : "فرستادن برای ویترین"}</button>
        {d.id && (ask ? <div className="hs-st-ask"><span>این کار از ویترین برداشته شود؟</span><button type="button" className="btn btn-line" onClick={remove} disabled={!!busy}>بله، بردار</button><button type="button" className="hs-link" onClick={() => setAsk(false)}>نه</button></div>
          : <button type="button" className="hs-link hs-st-del" onClick={() => setAsk(true)}>برداشتن این کار از ویترین</button>)}
      </div>
    </section>
  );
  return (
    <section className="hs-sec hs-studio" aria-labelledby="hs-st-h">
      <div className="hs-box-head"><h2 className="hs-h" id="hs-st-h">محصولات من در لئون</h2><p>فقط کارهای خودتان را می‌بینید. کار تازه بفرستید یا کارهای قبلی را ویرایش کنید؛ لئون بررسی و قیمت‌گذاری می‌کند.</p></div>
      <button type="button" className="btn btn-gold hs-wide" onClick={() => open()}>+ کار تازه برای ویترین</button>
      {done && <p className="hs-sent hs-st-done" role="status">{done}</p>}
      {!items ? <Loader label="در حال آوردن کارهای شما" /> : !items.length ? <p className="hs-empty">هنوز کاری نفرستاده‌اید.</p> : (
        <ul className="hs-vgrid">
          {items.map(it => { const s = ST[it.status || "live"] || ST.live, m = it.media.find(x => x.type === "image") || it.media[0]; return (
            <li key={it.id}><button type="button" className="hs-vcard paper" onClick={() => open(it)}>
              <span className="hs-vcard-pic">{m ? <Pic m={m} className="hs-vimg" /> : <span className="hs-vimg hs-st-ph" />}<em className={"hs-st-b " + s[1]}>{s[0]}</em></span>
              <b>{it.name}</b><span className="num">{gram(it.weight)} گرم · عیار {faDigits(it.carat)}{it.supAjrat != null ? ` · اجرت شما ${faDigits(it.supAjrat)}٪` : ""}</span>
            </button></li>); })}
        </ul>
      )}
    </section>
  );
}
