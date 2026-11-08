"use client";
// One invoice in «حساب من», laid out like the ledger's printed sheet (leon-gold/index.html: #retail / #whole): the header,
// every row with all its columns, melted gold taken, the gold trade, the transfer, the settlement card, both balances, the
// invoice terms, the declaration and the signature boxes. The numbers come worked out from the server (portal.mjs invDoc).
// «ذخیره‌ی PDF» draws the sheet into an A4 PDF the same way the ledger does (html2canvas + jsPDF from cdnjs).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RULES } from "@/lib/content";
import { faDigits, jdate, latin, type Entry, type Inv } from "@/lib/hesab";

const g3 = (n: number) => (n ? Math.abs(n).toLocaleString("fa-IR", { maximumFractionDigits: 3 }) : "");
const g3z = (n: number) => Math.abs(n).toLocaleString("fa-IR", { maximumFractionDigits: 3 });
const rl = (n: number) => (n ? Math.abs(Math.round(n)).toLocaleString("fa-IR") : "");
const rlz = (n: number) => Math.abs(Math.round(n)).toLocaleString("fa-IR");
const fa = (s: string | number) => faDigits(String(s ?? ""));
// the ledger's words for a balance: above zero the party owes Leon
function Bal({ v, d }: { v: number; d: boolean }) {
  const z = Math.abs(v) < (d ? 0.0005 : 0.5);
  return <b className={"iv-bal " + (z ? "z" : v > 0 ? "dr" : "cr")}><span className="num">{d ? g3z(z ? 0 : v) : rlz(z ? 0 : v)}</span><em>{z ? "تسویه" : v > 0 ? "بدهکار" : "بستانکار"}</em></b>;
}
const Row = ({ k, children, big }: { k: string; children: React.ReactNode; big?: boolean }) => <div className={"iv-kv" + (big ? " big" : "")}><span>{k}</span>{children}</div>;
const N = ({ v }: { v: string }) => <b className="num">{v || "۰"}</b>;

function loadLib(src: string, ok: () => unknown) {
  return new Promise<void>((res, rej) => { if (ok()) return res(); const s = document.createElement("script"); s.src = src; s.onload = () => (ok() ? res() : rej(new Error("lib"))); s.onerror = () => rej(new Error("lib")); document.head.appendChild(s); });
}
type W = Window & { html2canvas?: (el: HTMLElement, o: object) => Promise<HTMLCanvasElement>; jspdf?: { jsPDF: new (o: object) => { addImage: (...a: unknown[]) => void; output: (t: string) => Blob } } };

export function InvoiceSheet({ e, name, onClose }: { e: Entry; name: string; onClose: () => void }) {
  const v = e.inv as Inv;
  const box = useRef<HTMLDivElement>(null), page = useRef<HTMLDivElement>(null);
  const [sc, setSc] = useState(1), [h, setH] = useState(0), [off, setOff] = useState(0), [busy, setBusy] = useState(""), [msg, setMsg] = useState("");
  useEffect(() => { const k = (x: KeyboardEvent) => { if (x.key === "Escape") onClose(); }; addEventListener("keydown", k); document.body.classList.add("hs-sheet-open");
    return () => { removeEventListener("keydown", k); document.body.classList.remove("hs-sheet-open"); }; }, [onClose]);
  // the A4 sheet keeps its own width and is scaled down to the screen, like the ledger's preview
  useLayoutEffect(() => {
    const fit = () => { if (!box.current || !page.current) return; const s = Math.min(1, box.current.clientWidth / page.current.offsetWidth); setSc(s); setH(page.current.offsetHeight * s); setOff(Math.max(0, (box.current.clientWidth - page.current.offsetWidth * s) / 2)); };
    fit(); const ro = new ResizeObserver(fit); if (box.current) ro.observe(box.current); if (page.current) ro.observe(page.current); return () => ro.disconnect();
  }, []);

  const whole = v.kind === "whole", title = whole ? (v.doc === "rc" ? "سند دریافتی" : "سند پرداختی") + " · عمده (گرمی)" : "فروش خرده";
  const file = "leon-gold-" + (whole ? "wholesale" : "retail") + "-invoice" + (v.no ? "-" + latin(v.no).replace(/[^0-9]/g, "") : "") + ".pdf";
  const pdf = async (share: boolean) => {
    if (busy || !page.current) return; setBusy(share ? "share" : "pdf"); setMsg("در حال ساخت PDF…");
    try {
      const w = window as W;
      await loadLib("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", () => w.html2canvas);
      await loadLib("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => w.jspdf?.jsPDF);
      if (document.fonts?.ready) await document.fonts.ready;
      const el = page.current, ww = el.offsetWidth, hh = el.offsetHeight, scale = Math.max(2, Math.min(3, Math.sqrt(16e6 / (ww * hh))));
      const canvas = await w.html2canvas!(el, { scale, backgroundColor: "#fbf7ec", useCORS: true, windowWidth: ww + 40, width: ww, height: hh,
        onclone: (d: Document) => { const c = d.querySelector(".iv-page") as HTMLElement | null, f = d.querySelector(".iv-fit") as HTMLElement | null;
          if (f) { f.style.height = "auto"; } if (c) { c.style.transform = "none"; d.body.prepend(c); c.style.position = "absolute"; c.style.top = "0"; c.style.left = "0"; c.style.right = "auto"; } } });
      const J = w.jspdf!.jsPDF, wmm = 210, hmm = Math.max(297, canvas.height * 210 / canvas.width);
      const doc = new J({ orientation: "portrait", unit: "mm", format: [wmm, hmm], compress: true });
      doc.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, wmm, canvas.height * 210 / canvas.width, undefined, "FAST");
      const blob = doc.output("blob"), f = new File([blob], file, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: object) => boolean };
      if ((share || /iPhone|iPad|iPod/.test(navigator.userAgent)) && nav.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: fa(e.label) }); setMsg(""); }
      else { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); setMsg("فایل PDF ذخیره شد."); }
    } catch (x) { setMsg((x as Error)?.name === "AbortError" ? "" : "PDF ساخته نشد. یک بار دیگر بزنید، یا از همین صفحه اسکرین‌شات بگیرید."); }
    finally { setBusy(""); }
  };

  const s = v.sum, st = v.set;
  return createPortal(
    <div className="hs-sheet-bg" onClick={x => { if (x.target === x.currentTarget) onClose(); }}>
      <article className="hs-inv hs-inv-full paper" role="dialog" aria-modal="true" aria-label={fa(e.label)}>
        <div className="iv-fit" ref={box} style={{ height: h || undefined }}>
          <div className="iv-page" ref={page} style={{ transform: `scale(${sc})`, right: off }}>
            <i className="iv-cn tr" /><i className="iv-cn tl" /><i className="iv-cn bl" /><i className="iv-cn br" />
            <header className="iv-hd">
              <div className="iv-contact num"><span>۰۹۱۲۹۳۷۴۵۵۲</span><span dir="ltr">@LEONJEWELRY</span><span dir="ltr">__leongold__</span></div>
              <div className="iv-brand"><h1>LEON GOLD</h1><p>طلا و جواهرات</p><small>NATURAL • LUXURY • TIMELESS</small></div>
              <div className="iv-plaque"><b>فاکتور</b><small>{title}</small></div>
            </header>
            <div className="iv-meta num">
              <span><em>تاریخ:</em><bdi dir="ltr">{fa(v.date || jdate(e.ts))}</bdi></span>
              <span><em>شماره سند:</em>{fa(v.no)}</span>
              {whole ? <span><em>سررسید:</em><bdi dir="ltr">{fa(v.extra)}</bdi></span> : <span><em>ساعت:</em><bdi dir="ltr">{fa(v.time || v.extra)}</bdi></span>}
            </div>
            <div className="iv-cust">
              <span><em>{whole ? "حساب:" : "خریدار:"}</em>{v.cust.name || name}</span>
              {whole && <span><em>فروشگاه:</em>{v.cust.shop}</span>}
              <span className="num"><em>تلفن:</em>{fa(v.cust.phone)}</span>
              <span className="w3"><em>آدرس:</em>{v.cust.addr}</span>
            </div>

            <table className="iv-t num">
              {whole
                ? <thead><tr><th>ردیف</th><th className="d">شرح کالا / کد</th><th>تعداد</th><th>وزن (گرم)</th><th>عیار</th><th>اجرت ٪</th><th>وزن ۷۵۰ (گرم)</th><th>اجرت (گرم)</th><th>جمع (گرم)</th></tr></thead>
                : <thead><tr><th>ردیف</th><th className="d">شرح کالا / کد</th><th>تعداد</th><th>وزن (گرم)</th><th>عیار</th><th>اجرت ٪</th><th>سود ٪</th><th>قیمت طلا</th><th>اجرت + سود</th><th>مبلغ (ریال)</th></tr></thead>}
              <tbody>{v.rows.map((r, k) => (
                <tr key={k} className={r.ret ? "ret" : ""}>
                  <td>{fa(k + 1)}</td><td className="d">{r.ret ? "برگشتی: " : ""}{fa(r.desc)}</td><td>{r.qty ? fa(r.qty) : ""}</td><td>{g3(r.weight)}</td><td>{r.carat ? g3(r.carat) : ""}</td><td>{r.ajrat ? g3(r.ajrat) : ""}</td>
                  {whole ? <><td>{g3(r.w750 || 0)}</td><td>{g3(r.ajratG || 0)}</td><td>{g3(r.totalG || 0)}</td></>
                    : <><td>{r.pf ? g3(r.pf) : ""}</td><td>{rl(r.gold || 0)}</td><td>{rl(r.ap || 0)}</td><td>{rl(r.amount || 0)}</td></>}
                </tr>))}</tbody>
              <tfoot><tr><td colSpan={2}>جمع</td><td>{v.tot.qty ? fa(v.tot.qty) : ""}</td><td>{g3(v.tot.weight)}</td><td /><td />
                {whole ? <><td>{g3(v.tot.w750 || 0)}</td><td>{g3(v.tot.ajratG || 0)}</td><td>{g3(v.tot.totalG || 0)}</td></>
                  : <><td /><td>{rl(v.tot.gold || 0)}</td><td>{rl(v.tot.ap || 0)}</td><td>{rl(v.tot.amount || 0)}</td></>}</tr></tfoot>
            </table>

            {whole && v.gold && v.gold.length > 0 && <table className="iv-t num">
              <thead><tr><th>ردیف</th><th>آبشده / متفرقه</th><th>وزن (گرم)</th><th>عیار</th><th>آزمایشگاه</th><th>انگ</th><th className="d">توضیحات</th><th>وزن ۷۵۰ (گرم)</th></tr></thead>
              <tbody>{v.gold.map((g, k) => <tr key={k}><td>{fa(k + 1)}</td><td>{g.type}</td><td>{g3(g.weight)}</td><td>{fa(g.purity)}</td><td>{g.lab}</td><td>{fa(g.ang)}</td><td className="d">{g.note}</td><td>{g3(g.g750)}</td></tr>)}</tbody>
              <tfoot><tr><td colSpan={7}>جمع آبشده و متفرقه · {v.goldDir === "dr" ? "پرداختی (بدهکار)" : "دریافتی (بستانکار)"}</td><td>{g3(s.gx || 0)}</td></tr></tfoot>
            </table>}

            {whole && v.trade && <table className="iv-t num">
              <thead><tr><th>خرید / فروش طلا</th><th>وزن (گرم ۷۵۰)</th><th>قیمت گرم ۱۸ (ریال)</th><th>قیمت مثقال ۱۸ (ریال)</th><th>مبلغ (ریال)</th><th>دریافت نقدی</th><th>پرداخت نقدی</th><th className="d">توضیحات</th></tr></thead>
              <tbody><tr><td>{v.trade.type === "sell" ? "فروش طلا به طرف" : v.trade.type === "buy" ? "خرید طلا از طرف" : "—"}</td><td>{g3(v.trade.w)}</td><td>{rl(v.trade.gp)}</td><td>{rl(Math.round(v.trade.gp * 4.3318))}</td><td>{rl(v.trade.amount)}</td><td>{rl(v.trade.cin)}</td><td>{rl(v.trade.cout)}</td><td className="d">{v.trade.note}</td></tr></tbody>
            </table>}

            <div className="iv-lower">
              <section className="iv-card">
                <h2>{whole ? "اطلاعات تکمیلی و تسویه" : "اطلاعات تکمیلی و پرداخت"}</h2>
                <Row k="قیمت یک گرم طلا (ریال):"><N v={rl(v.gp)} /></Row>
                <Row k="قیمت مثقال طلای ۱۸ عیار:"><N v={rl(st.mq)} /></Row>
                <Row k={whole ? "مانده قبلی (گرم):" : "مانده قبلی (ریال):"}><Bal v={st.prev} d={whole} /></Row>
                {whole && Math.abs(st.rprev || 0) >= 0.5 && <Row k="مانده قبلی (ریال):"><Bal v={st.rprev || 0} d={false} /></Row>}
                <Row k="وضعیت تحویل کالا:"><b>{st.deliv === "nd" ? "تحویل نشد" : "تحویل شد"}</b></Row>
                {whole ? <>
                  {!!st.recv && <Row k="طلای دریافتی (گرم):"><Bal v={-(st.recv || 0)} d /></Row>}
                  {v.hav && <Row k={v.hav.dir === "in" ? "حواله گرفته شد (گرم):" : "حواله داده شد (گرم):"}><b className="num">{g3z(v.hav.w)} · {v.hav.dir === "in" ? "به حساب ما نزد " : "از حساب ما نزد "}{v.hav.name}</b></Row>}
                  {!!st.cash && <Row k="پرداخت ریالی (تبدیل به گرم):"><Bal v={-(st.cash || 0)} d={false} /></Row>}
                  {!!st.late && <Row k="جریمه دیرکرد ٪:"><N v={g3(st.late || 0)} /></Row>}
                  {!!st.discG && <Row k="تخفیف (گرم):"><N v={g3(st.discG)} /></Row>}
                  {!!st.discR && <Row k="تخفیف (ریال):"><N v={rl(st.discR)} /></Row>}
                </> : <>
                  {(st.pays || []).map(p => <Row key={p.label} k={p.label + ":"}><Bal v={-p.v} d={false} /></Row>)}
                  {!!st.disc && <Row k="تخفیف (ریال):"><N v={rl(st.disc)} /></Row>}
                  {!!st.discG && <Row k="تخفیف (گرم، به قیمت همین فاکتور):"><N v={g3(st.discG)} /></Row>}
                </>}
              </section>
              <section className="iv-card iv-sum">
                <h2>{whole ? "مانده حساب" : "صورت‌حساب"}</h2>
                {whole ? <>
                  <Row k="جمع وزن ۷۵۰ کالا:"><N v={g3(s.pure || 0)} /></Row>
                  <Row k="جمع اجرت:"><N v={g3(s.aj || 0)} /></Row>
                  <Row k={`مالیات (${fa(v.tax)}٪ اجرت):`}><N v={g3(s.tax || 0)} /></Row>
                  {!!s.discG && <Row k="تخفیف (گرم):"><N v={g3(s.discG)} /></Row>}
                  <Row k="جمع این سند (گرم):" big><Bal v={s.final || 0} d /></Row>
                  <Row k="با مانده قبلی:"><Bal v={s.all || 0} d /></Row>
                  {!!s.gx && <Row k="آبشده و متفرقه (۷۵۰):"><N v={g3(s.gx)} /></Row>}
                  <Row k="دریافتی (گرم):"><N v={g3(s.got || 0)} /></Row>
                  {!!s.hv && <Row k={(s.hv || 0) > 0 ? "حواله داده شد (گرم):" : "حواله گرفته شد (گرم):"}><N v={g3(s.hv || 0)} /></Row>}
                  {!!s.trG && <Row k="معامله طلا (گرم):"><Bal v={s.trG || 0} d /></Row>}
                  <Row k="مانده نهایی (گرم):" big><Bal v={s.bal} d /></Row>
                  {!!s.discR && <Row k="تخفیف (ریال):"><N v={rl(s.discR)} /></Row>}
                  {v.trade && <Row k="مانده ریالی این سند:"><Bal v={s.trR || 0} d={false} /></Row>}
                  {v.trade && Math.abs(s.rprev || 0) >= 0.5 && <Row k="مانده ریالی قبلی:"><Bal v={s.rprev || 0} d={false} /></Row>}
                  {s.hasR && <Row k="مانده نهایی (ریال):" big><Bal v={s.rbal || 0} d={false} /></Row>}
                </> : <>
                  <Row k="جمع قیمت طلا:"><N v={rl(s.gold || 0)} /></Row>
                  <Row k="جمع اجرت + سود:"><N v={rl(s.ap || 0)} /></Row>
                  <Row k={`مالیات (${fa(v.tax)}٪ اجرت و سود):`}><N v={rl(s.tax || 0)} /></Row>
                  <Row k="مبلغ نهایی (ریال):" big><Bal v={s.final || 0} d={false} /></Row>
                  <Row k="با مانده قبلی:"><Bal v={s.all || 0} d={false} /></Row>
                  <Row k="جمع پرداختی:"><N v={rl(s.paid || 0)} /></Row>
                  <Row k="مانده حساب:" big><Bal v={s.bal} d={false} /></Row>
                </>}
              </section>
            </div>

            <div className="iv-notes">
              {v.note && <p className="iv-free"><em>توضیحات:</em> {v.note}</p>}
              <h3>آیین‌نامه‌ی خرید و فروش</h3>
              <ol>{whole ? RULES[0].items!.map(t => <li key={t}>{t}</li>)
                : <><li>اصالت و عیار کالا تضمین می‌شود؛ گواهی ضمانت همراه کالا تحویل می‌گردد.</li><li>اشتباه از طرفین قابل برگشت است.</li></>}</ol>
              {whole && v.doc !== "rc" && RULES[1].text && <p className="iv-decl">{RULES[1].text}</p>}
            </div>
            <div className="iv-sign"><div>مهر و امضای تحویل‌دهنده<small>LEON GOLD</small></div><div>مهر و امضای تحویل‌گیرنده<small>نام و نام خانوادگی:</small></div></div>
            <p className="iv-foot"><span className="en">THANK YOU FOR YOUR TRUST</span><span>گرم‌ها به عیار ۷۵۰ است. این نسخه از روی دفتر لئون گلد ساخته شده است.</span></p>
          </div>
        </div>
        {msg && <p className="hs-why" role="status">{msg}</p>}
        <div className="hs-row hs-inv-act">
          <button type="button" className="btn btn-gold" disabled={!!busy} onClick={() => pdf(false)}>{busy === "pdf" ? "در حال ساخت…" : "ذخیره‌ی PDF"}</button>
          <button type="button" className="btn btn-ink" disabled={!!busy} onClick={() => pdf(true)}>{busy === "share" ? "در حال ساخت…" : "اشتراک"}</button>
          <button type="button" className="hs-link" onClick={onClose}>بستن</button>
        </div>
      </article>
    </div>, document.body
  );
}
