"use client";
// The ledger's emerald bar: the jewel and the name in gold leaf, a few links and the one action.
// It sits clear over the hero and takes its woven band once the page scrolls.
// On a phone the menu is a small dropdown card under the ☰ button: links, then the three account pills, then the CTA.
import { useEffect, useState } from "react";

const LINKS = [
  ["#price", "قیمت امروز"],
  ["#collection", "مجموعه"],
  ["#heritage", "شیر در طلا"],
  ["museum/", "موزه"],
  ["#wholesale", "همکاران"],
  ["#order", "تماس"],
];

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
        <img src="/leaf.webp" alt="" width={18} height={34} />
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

      <div id="sheet" className="sheet" inert={!open} aria-hidden={!open} onClick={close}>
        <div className="sheet-in" onClick={e => e.stopPropagation()}>
          <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
          <nav className="sheet-links" aria-label="بخش‌های سایت">
            {LINKS.map(([h, t]) => <a key={h} href={h} onClick={close}>{t}</a>)}
          </nav>
          {/* the customers' and suppliers' own account, then the ledger; the CRM panel is opened from inside the ledger, never linked here */}
          <div className="sheet-more">
            <a className="sheet-pill" href="hesab/" onClick={close}>حساب من</a>
            <a className="sheet-pill" href={ledger} onClick={close}>دفتر لئون</a>
          </div>
          <a className="btn btn-gold sheet-cta" href="#order" onClick={close}>ثبت سفارش</a>
        </div>
      </div>
    </header>
  );
}
