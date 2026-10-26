"use client";
// The ledger's emerald bar: the jewel and the name in gold leaf, a few links and the one action.
// It sits clear over the hero and takes its woven band once the page scrolls.
import { useEffect, useState } from "react";

const LINKS = [
  ["#price", "قیمت امروز"],
  ["#collection", "مجموعه"],
  ["#heritage", "شیر در طلا"],
  ["#wholesale", "همکاران"],
  ["#order", "تماس"],
];

export default function Header() {
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
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  return (
    <header className={"bar" + (solid ? " solid" : "") + (open ? " open" : "")}>
      <a className="bar-brand" href="#top" aria-label="لئون گلد، بالای صفحه">
        <img src="leaf.png" alt="" width={18} height={34} />
        <span className="leaf">لئون گلد</span>
      </a>
      <nav className="bar-links" aria-label="بخش‌های سایت">
        {LINKS.map(([h, t]) => <a key={h} href={h} onClick={() => setOpen(false)}>{t}</a>)}
      </nav>
      <a className="btn btn-gold bar-cta" href="#order">ثبت سفارش</a>
      <button className="bar-menu" type="button" aria-expanded={open} aria-label={open ? "بستن فهرست" : "فهرست"} onClick={() => setOpen(!open)}>
        <i /><i /><i />
      </button>
    </header>
  );
}
