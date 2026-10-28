// The door of a vault: the sign-in screens of «پنل مدیریت» and «حساب من» share it, so they read as one family.
// The site's bar on top; under it a turning guilloché dial, the leaf seal in a gold-rimmed medallion, the name in
// gold leaf, then the page's own ivory card (its fields and flows stay in the page) and one fine line.
import type { ReactNode } from "react";

export default function Door({ name, latin, fine, children }: { name: string; latin: string; fine?: ReactNode; children: ReactNode }) {
  return (
    <div className="door">
      <header className="bar solid door-bar">
        <a className="bar-brand" href="../" aria-label="لئون گلد، صفحه‌ی اصلی">
          <img src="/leaf.webp" alt="" width={18} height={34} />
          <span className="leaf">لئون گلد</span>
        </a>
        <span className="door-bar-t">{name}</span>
        <a className="btn btn-line door-back" href="../">بازگشت به سایت</a>
      </header>
      <main className="door-in">
        <div className="door-dial" aria-hidden><i /></div>
        <div className="door-seal" aria-hidden><img src="/leaf.webp" alt="" width={30} height={56} /></div>
        <p className="door-latin" lang="en" dir="ltr">{latin}</p>
        <h1 className="door-title"><span className="leaf leaf-sweep">{name}</span></h1>
        <section className="door-card paper" aria-label={name}>
          <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
          {children}
        </section>
        {fine && <p className="door-fine">{fine}</p>}
      </main>
    </div>
  );
}
