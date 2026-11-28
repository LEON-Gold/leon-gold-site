// The door of a vault: the sign-in screens of «پنل مدیریت» and «حساب من» share it, so they read as one family.
// The site's bar on top; under it a turning guilloché dial, the leaf seal in a gold-rimmed medallion, the name in
// gold leaf, then the page's own ivory card (its fields and flows stay in the page) and one fine line.
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

// wide: a page with a lot to show (the public showcase) gets a wide card on a desktop instead of the narrow sign-in one
// shop: the showcase's own pages (owner, 2026-11-28: «حاشیه های صفحه خیلی خیلی زیادن»): the bar and the pieces, no dial,
// seal, big title or card around them. back/backLabel: a second link in the bar (a piece's page back to the showcase).
export default function Door({ name, latin, fine, children, wide, home = "../", shop, back, backLabel }: { name: string; latin: string; fine?: ReactNode; children: ReactNode; wide?: boolean; home?: string; shop?: boolean; back?: string; backLabel?: string }) {
  if (shop) return (
    <div className="door door-shop-page">
      <header className="bar solid door-bar">
        <a className="bar-brand" href={home} aria-label="لئون گلد، صفحه‌ی اصلی">
          <img src="/leaf.webp" alt="" width={18} height={34} />
          <span className="leaf">لئون گلد</span>
        </a>
        <span className="door-bar-t">{name}</span>
        <ThemeToggle className="door-theme" />
        {back && <a className="btn btn-line door-back door-back2" href={back}>{backLabel}</a>}
        <a className="btn btn-line door-back" href={home}>{back ? "سایت" : "بازگشت به سایت"}</a>
      </header>
      <main className="door-in door-shop-in">
        <section className={"door-card door-wide door-shop"} aria-label={name}>{children}</section>
        {fine && <p className="door-fine">{fine}</p>}
      </main>
    </div>
  );
  return (
    <div className="door">
      <header className="bar solid door-bar">
        <a className="bar-brand" href={home} aria-label="لئون گلد، صفحه‌ی اصلی">
          <img src="/leaf.webp" alt="" width={18} height={34} />
          <span className="leaf">لئون گلد</span>
        </a>
        <span className="door-bar-t">{name}</span>
        <ThemeToggle className="door-theme" />
        <a className="btn btn-line door-back" href={home}>بازگشت به سایت</a>
      </header>
      <main className="door-in">
        <div className="door-dial" aria-hidden><i /></div>
        <div className="door-seal" aria-hidden><img src="/leaf.webp" alt="" width={30} height={56} /></div>
        <p className="door-latin" lang="en" dir="ltr">{latin}</p>
        <h1 className="door-title"><span className="leaf leaf-sweep">{name}</span></h1>
        <section className={"door-card paper" + (wide ? " door-wide" : "")} aria-label={name}>
          <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
          {children}
        </section>
        {fine && <p className="door-fine">{fine}</p>}
      </main>
    </div>
  );
}
