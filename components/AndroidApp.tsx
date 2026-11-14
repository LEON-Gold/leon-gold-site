"use client";
// «دانلود اپ اندروید» (owner, 2026-11-14, from the Android-app tab): shown only on an Android phone, and not inside the app
// itself (its browser says LeonGoldApp). On an iPhone the profile's «افزودن به صفحه اصلی» stays the way. Only facts: what the
// app does, how to install it, and that it is not from a store (no «امن» or «تأییدشده»). The file is leon-gold-android's,
// replaced at the same address for new versions.
import { useEffect, useState } from "react";

const APK = "https://leon-gold.github.io/leon-gold-app/android/leon-gold.apk";

export default function AndroidApp({ where }: { where: "site" | "hesab" }) {
  const [on, setOn] = useState(false);
  // after the first paint (the server cannot know the phone), so nothing differs while the page wakes up
  useEffect(() => { setOn(isAndroid(navigator.userAgent)); }, []);
  if (!on) return null;
  const site = where === "site", body = <AndroidSteps site={site} />;
  return site
    ? <div className="aa aa-site"><small>اپ اندروید «حساب من»</small>{body}</div>
    : <section className="hs-login paper aa aa-hesab" aria-labelledby="aa-h"><h2 className="hs-h" id="aa-h">اپ اندروید «حساب من»</h2>{body}</section>;
}
export const isAndroid = (ua: string) => /Android/i.test(ua) && !/LeonGoldApp/i.test(ua);
export const inAndroidApp = (ua: string) => /LeonGoldApp/i.test(ua);
// what it does, how to install it, the download, the fine print
export function AndroidSteps({ site }: { site?: boolean }) {
  const v = (a: string, b: string) => (site ? a : b);
  return <>
    <p className="aa-t">«حساب من» را مثل یک اپ باز می‌کند و وارد حساب می‌ماند؛ عکس هم می‌شود فرستاد، و خبر سفارش‌ها و «ویترین» با اعلان می‌آید (گاهی تا ۱۵ دقیقه دیرتر).</p>
    <ol className="aa-steps">
      {["دانلود فایل", v("اگر گوشی پرسید، «اجازه نصب از این منبع» را بزن", "اگر گوشی پرسید، «اجازه نصب از این منبع» را بزنید"), "نصب"].map((t, i) => <li key={i}><b className="aa-n">{"۱۲۳"[i]}</b>{t}</li>)}
    </ol>
    <a className="btn btn-gold aa-dl" href={APK} download>دانلود اپ اندروید</a>
    <p className="aa-fine">«حساب من · لئون گلد»، نسخه‌ی ۱٫۱، اندروید ۷ به بالا. {v("اپ از فروشگاه نیست؛ اگر گوشی گفت «اپ ناشناخته»، «نصب در هر صورت» را بزن.", "اپ از فروشگاه نیست؛ اگر گوشی گفت «اپ ناشناخته»، «نصب در هر صورت» را بزنید.")}</p>
  </>;
}
