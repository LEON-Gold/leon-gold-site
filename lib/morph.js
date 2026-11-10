// @ts-nocheck
/* The move between pages (owner, 2026-11-10: "as if you never left, only the shapes changed"): the button or card
   you tapped grows, as a sheet of gold-tinted glass, into the page that opens, then melts away over it. Shared by
   «حساب من» (Hesab.tsx) and the ledger (copied in by offline/me-ledger.cjs). Between the site's own pages the
   browser's view transitions do the same (globals.css). Motion: clip-path only, a strong ease-in-out (on-screen
   morph), 480 ms; under «reduce motion» nothing moves. */
const MORPH = (function () {
  let last = null;
  const track = () => {
    if (typeof document === "undefined" || track.on) return; track.on = 1;
    document.addEventListener("pointerdown", e => { const el = e.target && e.target.closest && e.target.closest("button, a, [role=tab], .row, .dcard"); if (el) last = { r: el.getBoundingClientRect(), t: Date.now() }; }, { capture: true, passive: true });
  };
  // from the last tap (if it was a moment ago) into the element that now holds the new page
  const go = to => {
    const tap = last; last = null;
    if (!tap || Date.now() - tap.t > 900 || !to || !document.body.animate) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vw = innerWidth, vh = innerHeight, b = to.getBoundingClientRect(), r = tap.r;
    const t = { top: Math.max(0, b.top), left: Math.max(0, b.left), right: Math.min(vw, b.right), bottom: Math.min(vh, b.bottom) };
    if (t.bottom - t.top < 40 || t.right - t.left < 40) return;
    const ins = (x, rad) => `inset(${x.top}px ${vw - x.right}px ${vh - x.bottom}px ${x.left}px round ${rad}px)`;
    const g = document.createElement("div"); g.className = "lg-morph"; g.setAttribute("aria-hidden", "true"); document.body.appendChild(g);
    const a = g.animate([{ clipPath: ins(r, 16), opacity: .95 }, { clipPath: ins(t, 26), opacity: .9, offset: .62 }, { clipPath: ins(t, 26), opacity: 0 }], { duration: 480, easing: "cubic-bezier(0.77, 0, 0.175, 1)" });
    a.onfinish = a.oncancel = () => g.remove();
    to.animate([{ opacity: .35, transform: "scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 140, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" });
  };
  return { track, go };
})();
export default MORPH;
export const MORPH_CSS = `.lg-morph{position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:radial-gradient(120% 90% at 50% 0%,rgba(226,203,148,.55),rgba(201,162,76,.28) 45%,rgba(19,52,35,.22));-webkit-backdrop-filter:blur(10px) saturate(1.2);backdrop-filter:blur(10px) saturate(1.2);box-shadow:inset 0 0 0 1px rgba(226,203,148,.6)}`;
