"use client";
// The statement in order, from the first document to the last, and the full report as an A4 PDF: each account (gold, rial)
// with every document, its date, debit, credit and the balance after it, the invoice lines under each invoice, and totals.
// The order is the document's own date (then when it was entered), so the balance after each row is worked out here
// in that order; the final balance is the server's (leon-gold-server/portal.mjs account()).
import { faDigits, gram, jdate, latin, rial, type Account, type Entry } from "@/lib/hesab";

// a ledger date may be typed «۱۴۰۵/۰۷/۲۸», «۱۴۰۵٫۰۷٫۲۸» or «1405-7-28»: always «1405/07/28» (Latin digits)
export const normDate = (s?: string) => {
  const m = /^(\d{4})\D+(\d{1,2})\D+(\d{1,2})$/.exec(latin(s || "").trim());
  return m ? `${m[1]}/${m[2].padStart(2, "0")}/${m[3].padStart(2, "0")}` : "";
};
export const entryDate = (e: Entry) => normDate(e.date) || normDate(jdate(e.ts));
const dayKey = (e: Entry) => (/^مانده اول دوره/.test(e.label) ? -1 : +entryDate(e).replace(/\//g, "") || 0);

export type Row = Entry & { day: string; debit: number; credit: number };
// an invoice settled in itself: the goods on one side and what was paid or received in it on the other, so it is not a bare zero
const split = (e: Entry) => { const g = e.gross ?? e.d, pay = g - e.d; return { debit: Math.max(g, 0) + Math.max(-pay, 0), credit: Math.max(-g, 0) + Math.max(pay, 0) }; };
// oldest first, each with the balance after it in this order
export function chrono(ent: Entry[]): Row[] {
  const rows = ent.slice().sort((a, b) => dayKey(a) - dayKey(b) || (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const run = { g: 0, r: 0 };
  return rows.map(e => {
    run[e.u] += e.d;
    return { ...e, day: entryDate(e), run: e.u === "g" ? Math.round(run.g * 1000) / 1000 : Math.round(run.r), ...split(e) };
  });
}
export const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
export const monthTitle = (day: string) => { const [y, m] = day.split("/"); return y && m ? `${MONTHS[+m - 1] || ""} ${faDigits(y)}` : "بدون تاریخ"; };
export const sideWord = (v: number, u: "g" | "r") => (Math.abs(v) < (u === "g" ? 0.0005 : 0.5) ? "تسویه" : v > 0 ? "بدهکار" : "بستانکار");
export const num = (v: number, u: "g" | "r") => (u === "g" ? gram(v) : rial(v));
export const totals = (rows: Row[], u: "g" | "r") => rows.filter(r => r.u === u).reduce((t, r) => ({ debit: t.debit + r.debit, credit: t.credit + r.credit, n: t.n + 1 }), { debit: 0, credit: 0, n: 0 });

// ---------- the PDF: A4 pages laid out here (rows never split across pages), drawn with html2canvas, put together with jsPDF ----------
type W = Window & { html2canvas?: (el: HTMLElement, o: object) => Promise<HTMLCanvasElement>; jspdf?: { jsPDF: new (o: object) => { addPage: (...a: unknown[]) => void; addImage: (...a: unknown[]) => void; output: (t: string) => Blob } } };
const lib = (src: string, ok: () => unknown) => new Promise<void>((res, rej) => { if (ok()) return res(); const s = document.createElement("script"); s.src = src; s.onload = () => (ok() ? res() : rej(new Error("lib"))); s.onerror = () => rej(new Error("lib")); document.head.appendChild(s); });
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const fd = (s: string) => esc(faDigits(s));

const CSS = `
.rp-page{width:794px;height:1123px;box-sizing:border-box;padding:40px 42px 34px;background:#fbf7ec;color:#17231c;font:400 12px/1.65 Vazirmatn,Tahoma,sans-serif;direction:rtl;position:relative;display:flex;flex-direction:column;border:1px solid #c59a50;box-shadow:inset 0 0 0 5px #fbf7ec,inset 0 0 0 6px rgba(197,154,80,.55)}
.rp-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:10px;border-bottom:1px solid rgba(197,154,80,.7);margin-bottom:12px}
.rp-brand{font:700 26px/1.1 serif;letter-spacing:.14em;color:#8a6420}
.rp-brand small{display:block;font:600 12px/1.6 Vazirmatn,Tahoma,sans-serif;letter-spacing:0;color:#0d3a2a}
.rp-title{text-align:left}.rp-title b{display:block;font:700 18px/1.4 Vazirmatn,Tahoma,sans-serif;color:#0d3a2a}.rp-title span{color:#5f6a5e;font-size:11.5px}
.rp-who{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 16px;padding:8px 12px;border:1px solid rgba(197,154,80,.5);border-radius:10px;background:rgba(255,255,255,.55);margin-bottom:12px}
.rp-who em{font-style:normal;color:#6b7468;margin-inline-end:6px}
.rp-sum{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.rp-sum div{border:1px solid rgba(197,154,80,.55);border-radius:10px;padding:8px 12px;background:#0d3a2a;color:#f1dfae}
.rp-sum small{display:block;color:#e8cf8e;font-size:11px}.rp-sum b{font-size:16px}
.rp-h2{font:700 14px/1.6 Vazirmatn,Tahoma,sans-serif;color:#0d3a2a;margin:6px 0 4px}
table.rp-t{width:100%;border-collapse:collapse;font-size:11.5px}
.rp-t th{background:#0d3a2a;color:#f1dfae;font-weight:600;padding:5px 4px;border:1px solid rgba(197,154,80,.4)}
.rp-t td{padding:4px;border:1px solid rgba(197,154,80,.3);text-align:center;vertical-align:top;white-space:nowrap}
.rp-t td.d{text-align:start;white-space:normal}
.rp-t .dr{color:#8b2e22}.rp-t .cr{color:#0d5a3e}
.rp-t tr.sub td{border-top:0;background:rgba(197,154,80,.07);color:#4b564e;font-size:10.5px}
.rp-t tr.tot td{font-weight:700;background:rgba(197,154,80,.16);color:#0d3a2a}
.rp-t tr.mo td{background:rgba(13,58,42,.07);color:#8a6420;font-weight:700;text-align:start}
.rp-foot{margin-top:auto;padding-top:8px;border-top:1px solid rgba(197,154,80,.5);display:flex;justify-content:space-between;color:#8a6420;font-size:10px}
`;

export async function statementPdf(a: Account, share: boolean) {
  const w = window as W;
  await lib("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", () => w.html2canvas);
  await lib("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => w.jspdf?.jsPDF);
  if (document.fonts?.ready) await document.fonts.ready;
  const rows = chrono(a.ent), today = jdate(new Date().toISOString()), first = rows.find(r => r.day)?.day || "", last = [...rows].reverse().find(r => r.day)?.day || "";
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;z-index:-1";
  host.innerHTML = `<style>${CSS}</style>`;
  document.body.appendChild(host);
  const head = (p: number) => `<div class="rp-hd"><div class="rp-brand">LEON GOLD<small>لئون گلد · طلا و جواهرات</small></div><div class="rp-title"><b>صورتحساب کامل</b><span>تاریخ گزارش ${fd(today)} · صفحه‌ی ${fd(String(p))}</span></div></div>`;
  const foot = `<div class="rp-foot"><span>این گزارش از روی دفتر لئون گلد ساخته شده است. گرم‌ها به عیار ۷۵۰ است.</span><span>THANK YOU FOR YOUR TRUST</span></div>`;
  const who = `<div class="rp-who"><span><em>حساب:</em>${esc(a.name)}</span><span><em>شماره‌ی حساب:</em><bdi dir="ltr">№ ${esc(a.id.slice(-6).toUpperCase())}</bdi></span><span><em>بازه:</em>${first ? `<bdi dir="ltr">${fd(first)}</bdi> تا <bdi dir="ltr">${fd(last)}</bdi>` : "—"}</span>${a.shop ? `<span><em>فروشگاه:</em>${esc(a.shop)}</span>` : ""}${a.phone ? `<span><em>تلفن:</em>${fd(a.phone)}</span>` : ""}</div>`;
  const sum = `<div class="rp-sum"><div><small>مانده‌ی حساب طلایی (گرم ۷۵۰)</small><b>${fd(gram(a.bal.g))} ${sideWord(a.bal.g, "g")}</b></div><div><small>مانده‌ی حساب ریالی</small><b>${fd(rial(a.bal.r))} ریال ${sideWord(a.bal.r, "r")}</b></div></div>`;
  // the rows of both accounts, as table rows that can each go on any page
  const blocks: { title: string; html: string[] }[] = [];
  for (const u of ["g", "r"] as const) {
    const list = rows.filter(r => r.u === u);
    if (!list.length) continue;
    const t = totals(rows, u), out: string[] = [];
    let mo = "";
    list.forEach((r, i) => {
      const mt = r.day ? monthTitle(r.day) : "";
      if (mt !== mo) { mo = mt; out.push(`<tr class="mo"><td colspan="7">${esc(mt || "بدون تاریخ")}</td></tr>`); }
      out.push(`<tr><td>${fd(String(i + 1))}</td><td><bdi dir="ltr">${fd(r.day)}</bdi></td><td class="d">${fd(r.label)}</td><td class="dr">${r.debit ? fd(num(r.debit, u)) : ""}</td><td class="cr">${r.credit ? fd(num(r.credit, u)) : ""}</td><td>${fd(num(r.run, u))}</td><td>${sideWord(r.run, u)}</td></tr>`);
      for (const l of r.lines || []) out.push(`<tr class="sub"><td></td><td></td><td class="d" colspan="5">${l.ret ? "برگشتی: " : ""}${fd(l.desc || "—")}${l.qty > 1 ? " · " + fd(String(l.qty)) + " عدد" : ""}${l.weight ? " · " + fd(gram(l.weight)) + " گرم" : ""}${l.carat ? " · عیار " + fd(String(l.carat)) : ""}${l.totalG ? " · " + fd(gram(l.totalG)) + " گرم ۷۵۰" : ""}${l.amount ? " · " + fd(rial(l.amount)) + " ریال" : ""}</td></tr>`);
    });
    out.push(`<tr class="tot"><td colspan="3">جمع (${fd(String(t.n))} سند)</td><td class="dr">${fd(num(t.debit, u))}</td><td class="cr">${fd(num(t.credit, u))}</td><td>${fd(num(u === "g" ? a.bal.g : a.bal.r, u))}</td><td>${sideWord(u === "g" ? a.bal.g : a.bal.r, u)}</td></tr>`);
    blocks.push({ title: `حساب ${u === "g" ? "طلایی (گرم ۷۵۰)" : "ریالی"}`, html: out });
  }
  const thead = `<thead><tr><th>ردیف</th><th>تاریخ</th><th style="width:38%">شرح</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th><th>تشخیص</th></tr></thead>`;
  // lay out: fill a page until the next row would overflow, then start another
  const pages: HTMLElement[] = [];
  let page: HTMLElement = document.createElement("div"), body: HTMLElement = page, tbody: HTMLElement | null = null;
  const newPage = () => {
    page = document.createElement("div"); page.className = "rp-page";
    page.innerHTML = head(pages.length + 1) + (pages.length ? "" : who + sum) + `<div class="rp-b"></div>` + foot;
    host.appendChild(page); pages.push(page); body = page.querySelector(".rp-b") as HTMLElement; tbody = null;
  };
  const room = () => { const f = page.querySelector(".rp-foot") as HTMLElement; return f.offsetTop - (body.offsetTop + body.offsetHeight) > 4; };
  newPage();
  for (const b of blocks) {
    const startTable = (cont: boolean) => { const h = document.createElement("div"); h.className = "rp-h2"; h.textContent = b.title + (cont ? " (ادامه)" : ""); body.appendChild(h); const t = document.createElement("table"); t.className = "rp-t"; t.innerHTML = thead + "<tbody></tbody>"; body.appendChild(t); tbody = t.querySelector("tbody"); };
    startTable(false);
    if (!room()) { body.lastChild?.remove(); body.lastChild?.remove(); newPage(); startTable(false); }
    for (const tr of b.html) {
      tbody!.insertAdjacentHTML("beforeend", tr);
      if (!room()) { tbody!.lastElementChild?.remove(); newPage(); startTable(true); tbody!.insertAdjacentHTML("beforeend", tr); }
    }
  }
  try {
    const J = w.jspdf!.jsPDF, doc = new J({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    for (let i = 0; i < pages.length; i++) {
      const c = await w.html2canvas!(pages[i], { scale: 2, backgroundColor: "#fbf7ec", width: 794, height: 1123, windowWidth: 900 });
      if (i) doc.addPage();
      doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }
    const blob = doc.output("blob"), name = `leon-gold-statement-${a.id.slice(-6).toUpperCase()}-${latin(today).replace(/\//g, "-")}.pdf`, file = new File([blob], name, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (d: object) => boolean };
    if ((share || /iPhone|iPad|iPod/.test(navigator.userAgent)) && nav.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "صورتحساب لئون گلد" }); return "shared"; }
    const u = URL.createObjectURL(blob), el = document.createElement("a"); el.href = u; el.download = name; document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    return "saved";
  } finally { host.remove(); }
}
