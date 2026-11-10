// @ts-nocheck
/* The move between pages, second version (owner, 2026-11-10: "the page opened faster than the transition, and it looked
   plain"). Now the transition IS the opening: the page you leave is frozen in place the moment you tap, the new page is
   drawn underneath and shows itself only through a circle that opens from your finger, with a gold vault ring riding
   its edge; the old page sinks back and dims behind it; then the new page's cards settle in one after another.
   Shared by «حساب من» (Hesab.tsx) and the ledger (copied in by offline/me-ledger.cjs); the site's own pages do the
   same with the browser's view transition (layout.tsx, VT_REVEAL).
   Use: MORPH.before(container) just before the content changes, MORPH.after(container) just after (same tick or the
   next layout effect). Motion: clip-path circle + transform/opacity, 640 ms strong ease-in-out (an on-screen morph);
   the cards 420 ms ease-out, 45 ms apart. Under «reduce motion»: a 160 ms cross-fade, nothing moves. */
const MORPH = (function () {
  let tap = null, shot = null;
  const EIO = "cubic-bezier(0.77, 0, 0.175, 1)", EO = "cubic-bezier(0.23, 1, 0.32, 1)", D = 640;
  const reduce = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = () => {
    if (typeof document === "undefined" || track.on) return; track.on = 1;
    document.addEventListener("pointerdown", e => { tap = { x: e.clientX, y: e.clientY, t: Date.now() }; }, { capture: true, passive: true });
  };
  const ground = () => { const b = getComputedStyle(document.body).backgroundColor, h = getComputedStyle(document.documentElement).backgroundColor; return b && b !== "rgba(0, 0, 0, 0)" ? b : h && h !== "rgba(0, 0, 0, 0)" ? h : "#07130e"; };
  // freeze what is on screen now, exactly where it is
  const before = el => {
    if (shot) { shot.layer.remove(); shot = null; }
    if (!el || !document.body.animate || !tap || Date.now() - tap.t > 1200) return;
    const r = el.getBoundingClientRect(), layer = document.createElement("div"), copy = el.cloneNode(true);
    const v = { top: Math.max(0, r.top), left: Math.max(0, r.left), right: Math.min(innerWidth, r.right), bottom: Math.min(innerHeight, r.bottom) };
    Object.assign(layer.style, { top: v.top + "px", left: v.left + "px", width: v.right - v.left + "px", height: Math.max(0, v.bottom - v.top) + "px" });
    layer.className = "lg-old"; layer.setAttribute("aria-hidden", "true"); layer.inert = true;
    copy.removeAttribute("id"); copy.querySelectorAll("[id]").forEach(n => n.removeAttribute("id"));
    Object.assign(copy.style, { position: "absolute", top: r.top - v.top + "px", left: r.left - v.left + "px", width: r.width + "px", margin: "0", animation: "none" });
    layer.style.background = ground(); layer.appendChild(copy); document.body.appendChild(layer);
    shot = { layer, x: tap.x, y: tap.y }; tap = null;
  };
  // open the new page from the finger, the old one sinking behind it
  const after = el => {
    const s = shot; shot = null; if (!s) return false;
    if (!el || reduce()) { if (el) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease" }); s.layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease" }).onfinish = () => s.layer.remove(); return true; }
    const vw = innerWidth, vh = innerHeight, R = Math.hypot(Math.max(s.x, vw - s.x), Math.max(s.y, vh - s.y)) + 30;
    const keep = { position: el.style.position, zIndex: el.style.zIndex, background: el.style.background, minHeight: el.style.minHeight };
    Object.assign(el.style, { position: keep.position || "relative", zIndex: "16", background: ground(), minHeight: "100vh" });
    const b = el.getBoundingClientRect(), cx = s.x - b.left, cy = s.y - b.top;
    const reveal = el.animate([{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)` }], { duration: D, easing: EIO });
    s.layer.firstChild.animate([{ transform: "scale(1)", opacity: 1, filter: "brightness(1)" }, { transform: "scale(.93)", opacity: .35, filter: "brightness(.7)" }], { duration: D, easing: EIO, fill: "forwards" });
    // the ring on the opening's edge, and a soft gold flash where the finger was
    const ring = document.createElement("div"); ring.className = "lg-ring"; ring.setAttribute("aria-hidden", "true"); document.body.appendChild(ring);
    ring.animate([{ left: s.x + "px", top: s.y + "px", width: "0px", height: "0px", opacity: 1 }, { left: s.x - R + "px", top: s.y - R + "px", width: 2 * R + "px", height: 2 * R + "px", opacity: .9, offset: .8 }, { left: s.x - R + "px", top: s.y - R + "px", width: 2 * R + "px", height: 2 * R + "px", opacity: 0 }], { duration: D, easing: EIO, fill: "forwards" });
    const dot = document.createElement("div"); dot.className = "lg-tapglow"; dot.setAttribute("aria-hidden", "true"); dot.style.left = s.x + "px"; dot.style.top = s.y + "px"; document.body.appendChild(dot);
    dot.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: .9 }, { transform: "translate(-50%,-50%) scale(1.6)", opacity: 0 }], { duration: 520, easing: EO, fill: "forwards" });
    // the new page's cards settle in, one after another
    const kids = Array.from(el.children).filter(k => k.getBoundingClientRect().top < vh).slice(0, 8);
    kids.forEach((k, i) => k.animate([{ transform: "translateY(18px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, delay: 180 + i * 45, easing: EO, fill: "backwards" }));
    const done = () => { s.layer.remove(); ring.remove(); dot.remove(); Object.assign(el.style, keep); el.style.clipPath = ""; };
    reveal.onfinish = done; reveal.oncancel = done;
    return true;
  };
  return { track, before, after, go: el => after(el) };
})();
export default MORPH;
export const MORPH_CSS = `.lg-old{position:fixed;z-index:15;pointer-events:none;overflow:hidden}
.lg-ring{position:fixed;z-index:42;pointer-events:none;border-radius:50%;border:1.5px solid rgba(226,203,148,.95);box-shadow:0 0 0 1px rgba(201,162,76,.35),0 0 26px 4px rgba(226,203,148,.45),inset 0 0 22px rgba(226,203,148,.35);box-sizing:border-box}
.lg-tapglow{position:fixed;z-index:43;pointer-events:none;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,rgba(255,243,207,.95),rgba(226,203,148,.5) 35%,transparent 70%)}`;
