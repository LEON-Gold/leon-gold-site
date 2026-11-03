"use client";
// «حساب من» as an app on the home screen, and its notifications. On an iPhone, Web Push works only from the icon added
// to the home screen (iOS 16.4+), so the profile first shows how to add it, then the switch. The service worker
// (public/hesab/sw.js) only shows what the sync server sends (leon-gold-server/notify.mjs).
import { useEffect, useState } from "react";
import { ApiError, getToken, pushKey, pushSub, pushTest, pushUnsub } from "@/lib/hesab";

// the folder «حساب من» is served from (the site may sit under a base path)
const dir = () => location.pathname.replace(/\/hesab(\/.*)?$/, "/hesab/");
const swReg = () => navigator.serviceWorker.register(dir() + "sw.js", { scope: dir() });
const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => matchMedia("(display-mode: standalone)").matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const keyBytes = (k: string) => Uint8Array.from(atob(k.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

// once per visit: the home-screen manifest (added here so it carries the base path) and the worker
export function useHomeApp(onTab: (t: string) => void) {
  useEffect(() => {
    if (!document.querySelector("link[rel=manifest]")) {
      const l = document.createElement("link"); l.rel = "manifest"; l.href = dir() + "manifest.webmanifest"; document.head.appendChild(l);
    }
    if (!("serviceWorker" in navigator)) return;
    swReg().catch(() => {});
    // a tapped notification while «حساب من» is already open: go to its section
    const m = (e: MessageEvent) => { if (e.data?.hsTab) onTab(e.data.hsTab); };
    navigator.serviceWorker.addEventListener("message", m);
    return () => navigator.serviceWorker.removeEventListener("message", m);
  }, [onTab]);
}

// before signing out: this device stops getting this party's notifications
export async function dropDevice() {
  try {
    const r = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration(dir()) : undefined, s = await r?.pushManager.getSubscription();
    if (s) { if (getToken()) await pushUnsub(s.endpoint).catch(() => {}); await s.unsubscribe(); }
  } catch {}
}

// the technical reason, small, so a screenshot of it tells what went wrong
const why = (e: unknown) => e instanceof ApiError ? "server " + e.status + " " + e.code : e instanceof Error ? e.name + ": " + e.message : String(e);

type St = "load" | "add" | "none" | "denied" | "off" | "on";
export function Notify({ demo }: { demo?: boolean }) {
  const [st, setSt] = useState<St>("load");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string; why?: string } | null>(null);
  useEffect(() => {
    (async () => {
      if (!supported()) return setSt(ios() && !standalone() ? "add" : "none");
      if (Notification.permission === "denied") return setSt("denied");
      const r = await navigator.serviceWorker.getRegistration(dir());
      setSt((await r?.pushManager.getSubscription()) && Notification.permission === "granted" ? "on" : "off");
    })().catch(() => setSt("none"));
  }, []);

  const on = async () => {
    if (busy) return; setBusy(true); setMsg(null);
    try {
      if (demo) { setSt("on"); return; }
      // the permission prompt must come straight from the tap (iOS)
      const p = await Notification.requestPermission();
      if (p !== "granted") { setSt(p === "denied" ? "denied" : "off"); return; }
      const r = await swReg(); await navigator.serviceWorker.ready;
      const s = (await r.pushManager.getSubscription()) || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(await pushKey()) });
      await pushSub(s.toJSON());
      setSt("on"); setMsg({ ok: true, t: "اعلان‌ها روشن شد. از این به بعد خبرهای تازه روی همین گوشی می‌آید." });
    } catch (e) { setMsg({ ok: false, t: e instanceof ApiError && e.code === "offline" ? "به سرور وصل نشدیم. اینترنت را بررسی کنید." : "روشن نشد. یک بار دیگر بزنید.", why: why(e) }); }
    finally { setBusy(false); }
  };
  const off = async () => {
    if (busy) return; setBusy(true); setMsg(null);
    try { if (!demo) await dropDevice(); setSt("off"); setMsg({ ok: true, t: "اعلان‌ها روی این گوشی خاموش شد." }); }
    finally { setBusy(false); }
  };
  const test = async () => {
    if (busy) return; setBusy(true); setMsg(null);
    try { if (!demo) { const r = await pushTest(); if (!r.ok) { setMsg({ ok: false, t: "اعلان آزمایشی فرستاده نشد.", why: r.results.map(x => x.host + " " + (x.status || "") + " " + x.reason).join(" | ") }); return; } } setMsg({ ok: true, t: "یک اعلان آزمایشی فرستاده شد؛ تا چند ثانیه‌ی دیگر می‌رسد." }); }
    catch (e) { setMsg({ ok: false, t: e instanceof ApiError && e.code === "no_sub" ? "این گوشی روی سرور ثبت نیست. «خاموش کردن» و بعد «روشن کردن اعلان‌ها» را بزنید." : "اعلان آزمایشی فرستاده نشد.", why: why(e) }); }
    finally { setBusy(false); }
  };

  return (
    <section className="hs-login hs-notify paper" id="hs-notify" aria-labelledby="hs-notify-h">
      <h2 className="hs-h" id="hs-notify-h">اعلان‌ها</h2>
      <p className="hs-prof-fine">کار تازه در ویترین، مرحله‌ی تازه‌ی سفارش‌تان، و کاری که به شما سپرده می‌شود، روی صفحه‌ی قفل گوشی خبر داده می‌شود.</p>
      {st === "load" ? null
        : st === "add" ? <ol className="hs-steps-a2hs">
            <li>در سافاری دکمه‌ی اشتراک <b aria-label="اشتراک">⬆︎</b> را بزنید.</li>
            <li>«افزودن به صفحه‌ی اصلی» (Add to Home Screen) را انتخاب کنید.</li>
            <li>«حساب من» را از آیکن تازه‌ی صفحه‌ی اصلی باز کنید و همین‌جا اعلان‌ها را روشن کنید.</li>
          </ol>
        : st === "none" ? <p className="hs-prof-fine">این مرورگر اعلان نمی‌گیرد. روی آیفون، iOS باید ۱۶٫۴ یا تازه‌تر باشد.</p>
        : st === "denied" ? <p className="hs-prof-fine">اجازه‌ی اعلان بسته است. در تنظیمات گوشی: Settings ← Notifications ← «حساب من»، و Allow Notifications را روشن کنید.</p>
        : st === "off" ? <button type="button" className="btn btn-gold" disabled={busy} onClick={on}>{busy ? "در حال روشن کردن…" : "روشن کردن اعلان‌ها"}</button>
        : <div className="hs-row"><span className="hs-on">✦ روشن است</span>
            <button type="button" className="hs-link" disabled={busy} onClick={test}>اعلان آزمایشی</button>
            <button type="button" className="hs-link" disabled={busy} onClick={off}>خاموش کردن</button></div>}
      {msg && <p className={msg.ok ? "hs-ok" : "hs-err"} role={msg.ok ? "status" : "alert"}>{msg.t}</p>}
      {msg?.why && <p className="hs-why" dir="ltr">{msg.why}</p>}
    </section>
  );
}
