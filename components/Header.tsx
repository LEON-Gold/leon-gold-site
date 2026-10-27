"use client";
// The ledger's emerald bar: the jewel and the name in gold leaf, a few links and the one action.
// It sits clear over the hero and takes its woven band once the page scrolls.
// On a phone the menu opens as a vault sheet: guilloché, gold corners, numbered rows and the ledger card.
import { useEffect, useState } from "react";

const LINKS = [
  ["#price", "قیمت امروز", "نرخ زنده‌ی اتحادیه و ماشین‌حساب"],
  ["#collection", "مجموعه", "کارهای ویترین با وزن و عیار"],
  ["#heritage", "شیر در طلا", "شیر در طلای ایران، از موزه‌ها"],
  ["museum/", "موزه", "علم و تاریخ طلا، از ستاره‌ها تا تهران"],
  ["#wholesale", "همکاران", "فروش عمده، به گرم"],
  ["#order", "تماس", "ثبت سفارش و راه‌های تماس"],
];
const fa = (n: number) => String(n).padStart(2, "0").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export default function Header({ ledger }: { ledger: string }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => {
      setSolid(window.scrollY > 40);
      const max = document.documentElement.scrollHeight - innerHeight;
      document.querySelector<HTMLElement>(".bar")?.style.setProperty("--p", String(max > 0 ? scrollY / max : 0));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);
  const close = () => setOpen(false);

  return (
    <header className={"bar" + (solid ? " solid" : "") + (open ? " open" : "")}>
      <a className="bar-brand" href="#top" aria-label="لئون گلد، بالای صفحه" onClick={close}>
        <img src="/leaf.png" alt="" width={18} height={34} />
        <span className="leaf">لئون گلد</span>
      </a>
      <nav className="bar-links" aria-label="بخش‌های سایت">
        {LINKS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
        <a className="bar-ledger" href="hesab/">حساب من</a>
        <a className="bar-ledger" href={ledger}>دفتر لئون</a>
      </nav>
      <a className="btn btn-gold bar-cta" href="#order">ثبت سفارش</a>
      <button className="bar-menu" type="button" aria-expanded={open} aria-controls="sheet" aria-label={open ? "بستن فهرست" : "فهرست"} onClick={() => setOpen(!open)}>
        <i /><i /><i />
      </button>

      <div id="sheet" className="sheet" inert={!open} aria-hidden={!open}>
        <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
        <div className="sheet-in">
          <p className="sheet-latin" lang="en" dir="ltr">LEON GOLD</p>
          <nav className="sheet-links" aria-label="بخش‌های سایت">
            {LINKS.map(([h, t, s], i) => (
              <a key={h} href={h} onClick={close} style={{ "--i": i } as React.CSSProperties}>
                <span className="sheet-n">{fa(i + 1)}</span>
                <span className="sheet-t"><b>{t}</b><small>{s}</small></span>
                <span className="sheet-go" aria-hidden>‹</span>
              </a>
            ))}
          </nav>
          {/* the customers' and suppliers' own account, then the shop's ledger */}
          <a className="sheet-ledger sheet-hesab" href="hesab/" style={{ "--i": LINKS.length } as React.CSSProperties}>
            <img src="/leaf.png" alt="" width={16} height={30} />
            <span className="sheet-t"><b className="leaf">حساب من</b><small>مانده و سفارش‌های مشتریان و تأمین‌کنندگان</small></span>
            <span className="sheet-go" aria-hidden>‹</span>
          </a>
          <a className="sheet-ledger" href={ledger} style={{ "--i": LINKS.length + 1 } as React.CSSProperties}>
            <img src="/leaf.png" alt="" width={16} height={30} />
            <span className="sheet-t"><b className="leaf">دفتر لئون</b><small>دفتر حساب و انبار مغازه</small></span>
            <span className="sheet-go" aria-hidden>‹</span>
          </a>
          <a className="btn btn-gold sheet-cta" href="#order" onClick={close}>ثبت سفارش</a>
        </div>
      </div>
    </header>
  );
}
