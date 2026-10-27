"use client";
// «مشتریان»: everyone the ledger has as a customer, searchable by name, phone or tag, with the few lists the counter needs.
import { useState } from "react";
import { Client, ago, dayNo, daysUntil, fa, latin, today, toman } from "@/lib/crm";

type Filter = "all" | "soon" | "quiet" | "top" | "new";
const FILTERS: [Filter, string][] = [["all", "همه"], ["top", "خوش‌خریدها"], ["soon", "مناسبت نزدیک"], ["quiet", "کم‌پیدا"], ["new", "بی‌خرید"]];
const norm = (s: string) => latin(s).replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\s‌-]/g, "").toLowerCase();

export default function Clients({ all }: { all: Client[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>("all");
  const t = today();
  const near = (c: Client) => Math.min(daysUntil(c.person.birthday) ?? 999, daysUntil(c.person.anniversary) ?? 999);

  let list = all;
  if (q.trim()) {
    const n = norm(q);
    list = list.filter((c) => norm([c.party.name, c.party.phone, c.party.shop, ...(c.person.tags || [])].join(" ")).includes(n));
  }
  if (f === "soon") list = list.filter((c) => near(c) <= 30).sort((a, b) => near(a) - near(b));
  else if (f === "quiet") list = list.filter((c) => c.last && t - dayNo(new Date(c.last)) > 180).sort((a, b) => b.spent - a.spent);
  else if (f === "top") list = list.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent);
  else if (f === "new") list = list.filter((c) => !c.invoices.length);
  else list = [...list].sort((a, b) => (b.last || b.party.ts || "").localeCompare(a.last || a.party.ts || ""));

  return (
    <div className="pn-page">
      <div className="pn-head">
        <h1>مشتریان <span className="pn-count">{fa(all.length)}</span></h1>
        <p>از «دفتر لئون» می‌آیند. مشتری تازه را در دفتر ثبت کن تا این‌جا هم بیاید.</p>
      </div>
      <div className="pn-tools">
        <label className="pn-search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام، شماره یا برچسب" aria-label="جست‌وجو" type="search" />
        </label>
        <div className="pn-chips" role="tablist">
          {FILTERS.map(([k, t]) => <button key={k} role="tab" aria-selected={f === k} onClick={() => setF(k)}>{t}</button>)}
        </div>
      </div>
      <div className="pn-card pn-list">
        {list.length ? (
          <ul className="pn-rows">
            {list.map((c) => {
              const d = near(c);
              return (
                <li key={c.party.id} className="pn-row">
                  <a href={`#/c/${encodeURIComponent(c.party.id)}`} className="pn-row-main">
                    <b>{c.party.name}{(c.person.tags || []).slice(0, 2).map((t) => <i key={t} className="pn-label">{t}</i>)}</b>
                    <span>{c.last ? "آخرین خرید " + ago(c.last) : "هنوز خریدی ثبت نشده"}{d <= 30 ? "، مناسبت " + (d === 0 ? "امروز" : fa(d) + " روز دیگر") : ""}</span>
                  </a>
                  <span className="pn-tag">{c.spent ? toman(c.spent) : c.grams ? fa(c.grams, 2) + " گرم" : ""}{c.invoices.length > 0 && <small>{fa(c.invoices.length)} فاکتور</small>}</span>
                </li>
              );
            })}
          </ul>
        ) : <p className="pn-empty">{all.length ? "کسی با این مشخصات پیدا نشد." : "هنوز مشتری‌ای در دفتر نیست."}</p>}
      </div>
    </div>
  );
}
