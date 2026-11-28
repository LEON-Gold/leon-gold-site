// «لئون کیدز» (owner, 2026-11-14): the children's pieces have a page and a look of their own, from the owner's logo
// (rose gold pressed in cream paper) and mood boards: blush paper, soft watercolour clouds, small stars. The look is
// the same in the light and the dark theme. Styles: components/hesab/kids.css.
import type { ReactNode } from "react";

// shop (owner, 2026-11-28): like the showcase, no big logo or card around the pieces; the logo stays small in the bar.
// base: the path back to the site's root ("../" on kids/, "../../" on kids/item/).
export default function KidsDoor({ children, fine, shop, base = "../" }: { children: ReactNode; fine?: ReactNode; shop?: boolean; base?: string }) {
  return (
    <div className={"kids kd" + (shop ? " kd-shop-page" : "")}>
      <header className="kd-bar">
        <a className="kd-brand" href={base + "kids/"} aria-label="لئون کیدز"><img src="/kidsart/mark.webp" alt="" width={87} height={160} /><span>لئون کیدز</span></a>
        <a className="kd-back" href={base + "vitrin/"}>ویترین لئون گلد</a>
        <a className="kd-back kd-home" href={base}>صفحه‌ی اصلی</a>
      </header>
      <main className="kd-main">
        {!shop && <h1 className="kd-hero"><img src="/kidsart/logo.webp" alt="لئون کیدز" width={720} height={838} /></h1>}
        {!shop && <p className="kd-sub">زیرمجموعه‌ی لئون گلد</p>}
        <section className={"kd-card door-wide" + (shop ? " kd-shop" : "")} aria-label="لئون کیدز">{children}</section>
        {fine && <p className="kd-fine">{fine}</p>}
      </main>
    </div>
  );
}
