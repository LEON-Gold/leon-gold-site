// @ts-nocheck
/* Leon's own loading mark (owner, 2026-11-10: "instead of a page's name while it loads, an animation of its own"):
   a gold leaf drawing itself inside a slowly turning guilloché ring. Plain strings, so the ledger (copied in by
   offline/me-ledger.cjs) and the site (components/Loader.tsx) show the same thing. Motion: the ring turns at a
   constant speed (linear), the leaf draws and fills on an ease-in-out loop; under «reduce motion» it only glows. */
export const LOADER_SVG = '<svg class="lg-ld" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="lgLdG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ac8641"/><stop offset=".45" stop-color="#f3ebdb"/><stop offset=".7" stop-color="#d5b56d"/><stop offset="1" stop-color="#9a6a0e"/></linearGradient></defs>'
  + '<g class="lg-ld-ring">' + Array.from({ length: 12 }, (_, i) => `<ellipse cx="60" cy="60" rx="50" ry="22" transform="rotate(${i * 15} 60 60)"/>`).join("") + '<circle cx="60" cy="60" r="54"/></g>'
  + '<path class="lg-ld-leaf" pathLength="1" d="M60 98C40 82 36 50 63 18c19 24 21 56-3 80Z"/><path class="lg-ld-vein" pathLength="1" d="M60 96C59 74 60 48 63 20"/></svg>';
export const LOADER_CSS = `.lg-ld-w{display:grid;justify-items:center;align-content:center;gap:10px;padding:28px 0;color:#c9a24c}
.lg-ld{width:96px;height:96px;overflow:visible}
.lg-ld-ring{fill:none;stroke:#c9a24c;stroke-width:.6;opacity:.55;transform-origin:60px 60px;animation:lgLdTurn 14s linear infinite}
.lg-ld-ring circle{stroke-width:1;opacity:.8}
.lg-ld-leaf{fill:url(#lgLdG);fill-opacity:0;stroke:#d5b56d;stroke-width:1.6;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:lgLdDraw 2.4s cubic-bezier(0.77,0,0.175,1) infinite}
.lg-ld-vein{fill:none;stroke:#7a5c25;stroke-width:1;stroke-dasharray:1;stroke-dashoffset:1;animation:lgLdVein 2.4s cubic-bezier(0.77,0,0.175,1) infinite}
.lg-ld-t{font-size:12.5px;letter-spacing:.02em;opacity:.85}
@keyframes lgLdTurn{to{transform:rotate(360deg)}}
@keyframes lgLdDraw{0%{stroke-dashoffset:1;fill-opacity:0}45%{stroke-dashoffset:0;fill-opacity:0}70%{stroke-dashoffset:0;fill-opacity:1}88%{stroke-dashoffset:0;fill-opacity:1}100%{stroke-dashoffset:-1;fill-opacity:0}}
@keyframes lgLdVein{0%,40%{stroke-dashoffset:1}70%,88%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}
@keyframes lgLdGlow{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.lg-ld-ring{animation:none}.lg-ld-leaf{animation:lgLdGlow 2.4s ease infinite;stroke-dashoffset:0;fill-opacity:1}.lg-ld-vein{animation:none;stroke-dashoffset:0}}`;
