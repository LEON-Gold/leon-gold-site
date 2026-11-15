"use client";
// «دانلود اپ اندروید» (owner, 2026-11-14, from the Android-app tab): shown only on an Android phone, and not inside the app
// itself (its browser says LeonGoldApp). On an iPhone the profile's «افزودن به صفحه اصلی» stays the way. Only facts: what the
// app does, how to install it, and that it is not from a store (no «امن» or «تأییدشده»). The file is leon-gold-android's,
// replaced at the same address for new versions.
import { useEffect, useState } from "react";

// from the owner's domain, served by the sync server (leon-gold-server web.mjs, apps/): GitHub is slow from Iran (owner, 2026-11-15)
const APK = "https://leongold.net/apps/leon-gold.apk";
// the desktop «حساب من» apps (owner, 2026-11-15: «بخش دانلود اپ»): the same place, each computer its own file
const WIN = "https://leongold.net/apps/leon-hesab-windows.exe", MAC = "https://leongold.net/apps/leon-hesab-mac.zip";

type OS = "android" | "windows" | "mac" | "";
// an iPad says «Macintosh» too, but it has a touch screen; inside one of Leon's own apps nothing is offered
export const osOf = (ua: string, touch: number): OS => /LeonGoldApp/i.test(ua) ? "" : /Android/i.test(ua) ? "android"
  : /Windows NT/i.test(ua) ? "windows" : /Macintosh/i.test(ua) && touch < 2 ? "mac" : "";
const TITLE = { android: "اپ اندروید «حساب من»", windows: "اپ ویندوز «حساب من»", mac: "اپ مک «حساب من»" };

export default function AndroidApp({ where }: { where: "site" | "hesab" }) {
  const [os, setOs] = useState<OS>("");
  // after the first paint (the server cannot know the device), so nothing differs while the page wakes up
  useEffect(() => { setOs(osOf(navigator.userAgent, navigator.maxTouchPoints || 0)); }, []);
  if (!os) return null;
  const site = where === "site", body = os === "android" ? <AndroidSteps site={site} /> : <DesktopSteps os={os} site={site} />;
  return site
    ? <div className="aa aa-site"><small>{TITLE[os]}</small>{body}</div>
    : <section className="hs-login paper aa aa-hesab" aria-labelledby="aa-h"><h2 className="hs-h" id="aa-h">{TITLE[os]}</h2>{body}</section>;
}
export const isAndroid = (ua: string) => /Android/i.test(ua) && !/LeonGoldApp/i.test(ua);
// Windows and Mac: what it does, how to install it, the download; only facts (not from a store, no «امن»)
function DesktopSteps({ os, site }: { os: "windows" | "mac"; site?: boolean }) {
  const v = (a: string, b: string) => (site ? a : b), win = os === "windows";
  const steps = win
    ? ["دانلود فایل", v("باز کردن فایل؛ اگر ویندوز گفت «Windows protected your PC»، «More info» و بعد «Run anyway» را بزن", "باز کردن فایل؛ اگر ویندوز گفت «Windows protected your PC»، «More info» و بعد «Run anyway» را بزنید"), "«حساب من» باز می‌شود و وارد حساب می‌ماند"]
    : ["دانلود و باز کردن فایل zip", v("«حساب من» را به پوشه‌ی Applications بکش", "«حساب من» را به پوشه‌ی Applications بکشید"), v("بار اول روی آن راست‌کلیک کن و «Open» را بزن", "بار اول روی آن راست‌کلیک کنید و «Open» را بزنید")];
  return <>
    <p className="aa-t">«حساب من» را مثل یک برنامه روی {win ? "ویندوز" : "مک"} باز می‌کند و وارد حساب می‌ماند؛ خبر سفارش‌ها با اعلان روی صفحه می‌آید.</p>
    <ol className="aa-steps">{steps.map((t, i) => <li key={i}><b className="aa-n">{"۱۲۳"[i]}</b>{t}</li>)}</ol>
    <a className="btn btn-gold aa-dl" href={win ? WIN : MAC} download>{win ? "دانلود اپ ویندوز" : "دانلود اپ مک"}</a>
    <p className="aa-fine">{win ? "«حساب من · لئون گلد» برای ویندوز ۱۰ و ۱۱." : "«حساب من · لئون گلد» برای مک با تراشه‌ی اپل (M1 به بعد)، macOS ۱۲ به بالا."} اپ از فروشگاه نیست.</p>
  </>;
}
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
    <p className="aa-fine">«حساب من · لئون گلد»، نسخه‌ی ۱٫۳، اندروید ۷ به بالا. {v("اپ از فروشگاه نیست؛ اگر گوشی گفت «اپ ناشناخته»، «نصب در هر صورت» را بزن.", "اپ از فروشگاه نیست؛ اگر گوشی گفت «اپ ناشناخته»، «نصب در هر صورت» را بزنید.")}</p>
  </>;
}
