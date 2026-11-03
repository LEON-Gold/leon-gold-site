// «حساب من»'s service worker: only the push notifications the sync server sends (leon-gold-server/notify.mjs).
// No caching: the page always loads fresh. A tap opens «حساب من» on the section the message is about.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch { m = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(m.title || "لئون گلد", {
    body: m.body || "", dir: "rtl", lang: "fa", icon: "icon-180.png", badge: "icon-180.png",
    data: { tab: m.tab || "" }, tag: m.tab ? "leon-" + m.tab : undefined, renotify: !!m.tab,
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const t = e.notification.data && e.notification.data.tab, url = new URL(t && t !== "home" ? "./?t=" + t : "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.postMessage({ hsTab: t || "home" }); return; }
    await self.clients.openWindow(url);
  })());
});
