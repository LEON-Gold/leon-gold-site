"use client";
// «امروز»: who to get in touch with today. Occasions in the next two weeks, follow-ups that are due,
// new requests, and good customers who have not bought for half a year.
import { useEffect, useState } from "react";
import {
  Client, LEAD_STATUS, Receipt, Store, ago, dayNo, daysUntil, fa, jParts, mdLabel, MONTHS, receiptPhotoUrl, receipts, today, toman, waLink,
} from "@/lib/crm";

const WEEK = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

// WhatsApp messages in the shop's own voice: polite «شما», short, signed, no prices or offers (those are the owner's to add)
export const greet = (kind: "birthday" | "anniversary" | "missed", name: string) =>
  kind === "birthday"
    ? `سلام ${name} عزیز، تولدتان مبارک 🌹 امیدواریم سال تازه‌تان پر از سلامتی و دل خوش باشد.\nبا احترام، لئون گلد`
    : kind === "anniversary"
      ? `سلام ${name} عزیز، سالگرد ازدواجتان مبارک 🌹 ان‌شاءالله سال‌های سال کنار هم شاد باشید.\nبا احترام، لئون گلد`
      : `سلام ${name} عزیز، وقتتان بخیر. مدتی است خدمتتان نرسیده‌ایم و جایتان در فروشگاه خالی است. هر وقت گذرتان افتاد، خوشحال می‌شویم ببینیمتان.\nلئون گلد`;

export default function Today({ st, all }: { st: Store; all: Client[] }) {
  const t = today(), j = jParts(new Date());
  const dated = (d: number) => (d === 0 ? "امروز" : d === 1 ? "فردا" : fa(d) + " روز دیگر");

  const occasions = all.flatMap((c) => (["birthday", "anniversary"] as const).map((k) => ({ c, k, d: daysUntil(c.person[k]) })))
    .filter((o): o is typeof o & { d: number } => o.d != null && o.d <= 14).sort((a, b) => a.d - b.d);
  const due = all.filter((c) => c.person.nextAt && dayNo(new Date(c.person.nextAt)) <= t)
    .sort((a, b) => (a.person.nextAt || "").localeCompare(b.person.nextAt || ""));
  const leads = Object.values(st.leads).filter((l) => l.status === "new").sort((a, b) => b.ts.localeCompare(a.ts));
  const quiet = all.filter((c) => c.last && t - dayNo(new Date(c.last)) > 180).sort((a, b) => b.spent - a.spent).slice(0, 6);
  const calls = occasions.filter((o) => o.d <= 1).length + due.length + leads.length;

  return (
    <div className="pn-page">
      <div className="pn-hero">
        <p className="pn-date">{WEEK[new Date().getDay()]}، {fa(j.d)} {MONTHS[j.m - 1]} {fa(j.y).replace(/٬/g, "")}</p>
        <h1>{calls ? <>امروز <em className="leaf">{fa(calls)}</em> تماس منتظر توست</> : "امروز کسی منتظر تماس نیست"}</h1>
        <p className="pn-hero-sub">{fa(all.length)} مشتری در دفتر، {fa(Object.values(st.leads).filter((l) => l.status === "new" || l.status === "talking").length)} سفارش باز</p>
      </div>

      <PendingReceipts />

      <div className="pn-grid">
        <Block title="مناسبت‌های دو هفته‌ی پیش رو" empty="در دو هفته‌ی آینده تولد یا سالگردی ثبت نشده. تاریخ‌ها را در صفحه‌ی هر مشتری بنویس." lead>
          {occasions.map(({ c, k, d }) => (
            <Row key={c.party.id + k} href={`#/c/${encodeURIComponent(c.party.id)}`} name={c.party.name}
              meta={(k === "birthday" ? "تولد" : "سالگرد ازدواج") + " " + mdLabel(c.person[k])} tag={dated(d)} hot={d <= 1}
              wa={waLink(c.party.phone, greet(k, c.party.name))} />
          ))}
        </Block>

        <Block title="پیگیری‌های امروز" empty="پیگیری‌ای برای امروز نمانده.">
          {due.map((c) => (
            <Row key={c.party.id} href={`#/c/${encodeURIComponent(c.party.id)}`} name={c.party.name}
              meta={c.person.nextNote || "پیگیری"} tag={dayNo(new Date(c.person.nextAt!)) < t ? "عقب افتاده" : "امروز"} hot
              wa={waLink(c.party.phone, `سلام ${c.party.name} عزیز، از لئون گلد مزاحم می‌شویم.`)} />
          ))}
        </Block>

        <Block title="سفارش‌های تازه" empty="سفارش تازه‌ای نیست." more={leads.length ? ["همه‌ی سفارش‌ها", "#/leads"] : undefined}>
          {leads.slice(0, 5).map((l) => (
            <Row key={l.id} href="#/leads" name={l.name} meta={[l.what, l.source].filter(Boolean).join("، ")} tag={ago(l.ts)} sub={LEAD_STATUS[l.status]}
              wa={waLink(l.phone, `سلام ${l.name} عزیز، از لئون گلد درباره‌ی سفارشتان پیام می‌دهیم.`)} />
          ))}
        </Block>

        <Block title="مشتری‌هایی که مدتی نیامده‌اند" empty="همه‌ی مشتری‌ها در شش ماه گذشته خرید داشته‌اند.">
          {quiet.map((c) => (
            <Row key={c.party.id} href={`#/c/${encodeURIComponent(c.party.id)}`} name={c.party.name}
              meta={"آخرین خرید " + ago(c.last)} tag={c.spent ? toman(c.spent) + " تومان" : ""}
              wa={waLink(c.party.phone, greet("missed", c.party.name))} />
          ))}
        </Block>
      </div>
    </div>
  );
}

// a customer's card-to-card receipt, from «حساب من»: pending until you record the real document in the
// ledger and close it there (the ledger's «کاربران»). Read-only here; never touches a balance on its own.
function PendingReceipts() {
  const [rows, setRows] = useState<Receipt[] | null>(null);
  useEffect(() => { receipts().then(r => setRows(r.filter(x => x.status === "pending"))).catch(() => setRows([])); }, []);
  if (!rows?.length) return null;
  return (
    <div className="pn-card pn-block lead">
      <h2><i>◆</i>رسیدهای در انتظار (کارت‌به‌کارت)<span className="pn-count">{fa(rows.length)}</span></h2>
      <ul className="pn-rows">
        {rows.map(r => (
          <li key={r.id} className="pn-row pn-receipt">
            <div className="pn-row-main pn-receipt-main">
              <b>{r.partyName || "بدون نام"}</b>
              <span>{[r.amount ? toman(r.amount) + " تومان" : "", r.date, ago(new Date(r.ts).toISOString())].filter(Boolean).join(" · ")}</span>
              <ReceiptPhoto blob={r.blob} />
            </div>
          </li>
        ))}
      </ul>
      <p className="pn-empty pn-receipt-note">سند واقعی را در دفتر بنویس و رسید را در «کاربران»ِ دفتر ببند تا از این فهرست برود.</p>
    </div>
  );
}
function ReceiptPhoto({ blob }: { blob: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { let dead = false; receiptPhotoUrl(blob).then(u => !dead && setUrl(u)).catch(() => {}); return () => { dead = true; }; }, [blob]);
  return url ? <img className="pn-receipt-photo" src={url} alt="عکس رسید" /> : <span>در حال آوردن عکس…</span>;
}

function Block({ title, empty, children, lead, more }: { title: string; empty: string; children: React.ReactNode[]; lead?: boolean; more?: [string, string] }) {
  return (
    <div className={"pn-card pn-block" + (lead ? " lead" : "")}>
      <h2><i>◆</i>{title}{children.length > 0 && <span className="pn-count">{fa(children.length)}</span>}</h2>
      {children.length ? <ul className="pn-rows">{children}</ul> : <p className="pn-empty">{empty}</p>}
      {more && <a className="pn-more" href={more[1]}>{more[0]} ←</a>}
    </div>
  );
}

export function Row({ href, name, meta, tag, sub, wa, hot }: { href: string; name: string; meta?: string; tag?: string; sub?: string; wa?: string; hot?: boolean }) {
  return (
    <li className="pn-row">
      <a href={href} className="pn-row-main">
        <b>{name}</b>
        {meta && <span>{meta}</span>}
      </a>
      <span className={"pn-tag" + (hot ? " hot" : "")}>{tag}{sub && <small>{sub}</small>}</span>
      {wa && <a className="pn-wa" href={wa} target="_blank" rel="noopener" aria-label={"پیام واتس‌اپ به " + name}><WaIcon /></a>}
    </li>
  );
}

export function WaIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 5-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z" /></svg>;
}
