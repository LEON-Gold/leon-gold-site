// Guilloché: the engraving of banknotes and gold certificates, the same formula the ledger app draws with.
// Rings are phase-shifted polar sines r(t)=R+A·sin(N(t+φ))+a·sin(M(t−φ)); the band is the same weave laid flat.

function ring(S: number, R: number, A: number, N: number, a: number, M: number, L: number, n: number) {
  const c = S / 2;
  let o = "";
  for (let j = 0; j < L; j++) {
    const ph = ((j / L) * Math.PI * 2) / N;
    let p = "";
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2, r = R + A * Math.sin(N * (t + ph)) + a * Math.sin(M * (t - ph));
      p += (c + r * Math.cos(t)).toFixed(1) + "," + (c + r * Math.sin(t)).toFixed(1) + " ";
    }
    o += `<polyline points="${p}"/>`;
  }
  return o;
}

function band(W: number, H: number, L: number, f: number, A: number, a: number) {
  let o = "";
  for (let j = 0; j < L; j++) {
    const ph = (j / L) * Math.PI * 2;
    let p = "";
    for (let x = 0; x <= W; x += 3) {
      const u = (x / W) * Math.PI * 2;
      p += x + "," + (H / 2 + A * Math.sin(f * u + ph) * Math.cos(u * 0.5) + a * Math.sin(f * 3 * u - ph)).toFixed(1) + " ";
    }
    o += `<polyline points="${p}"/>`;
  }
  return o;
}

function svg(w: number, h: number, body: string, stroke: string, op: number, sw: number, stretch = false) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'${stretch ? " preserveAspectRatio='none'" : ""} fill='none' stroke='${stroke}' stroke-width='${sw}' stroke-opacity='${op}'>${body.replace(/"/g, "'")}</svg>`;
}
const url = (s: string) => `url("data:image/svg+xml,${s.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;

const GOLD = "#e8cf8e";
const INK = "#9c7433";

// the big rosette, drawn inline so it can turn
export const ROSETTE = svg(400, 400, ring(400, 150, 22, 24, 8, 72, 12, 520) + ring(400, 95, 16, 18, 5, 54, 10, 400) + ring(400, 48, 10, 12, 3, 36, 8, 260), GOLD, 0.5, 0.55);

// the hero's rosette engraves itself on arrival: every line has a unit length and its own delay, inner rings first
export const ROSETTE_DRAW = ROSETTE.replace(/<polyline /g, (() => {
  let k = 0;
  return () => `<polyline pathLength='1' style='animation-delay:${(0.15 + (29 - k++) * 0.06).toFixed(2)}s' `;
})());

// CSS variables for backgrounds: on emerald (gold lines) and on paper (darker gold lines)
export const GL_VARS: Record<string, string> = {
  "--gl-rosette": url(svg(400, 400, ring(400, 150, 22, 24, 8, 72, 12, 520) + ring(400, 95, 16, 18, 5, 54, 10, 400) + ring(400, 48, 10, 12, 3, 36, 8, 260), GOLD, 0.38, 0.55)),
  "--gl-small": url(svg(220, 220, ring(220, 82, 14, 20, 5, 60, 10, 440) + ring(220, 44, 9, 12, 3, 36, 8, 260), GOLD, 0.3, 0.5)),
  "--gl-band": url(svg(600, 64, band(600, 64, 14, 6, 18, 4), GOLD, 0.2, 0.55, true)),
  "--gl-paper": url(svg(220, 220, ring(220, 82, 14, 20, 5, 60, 10, 440) + ring(220, 44, 9, 12, 3, 36, 8, 260), INK, 0.16, 0.5)),
  "--gl-paperband": url(svg(600, 64, band(600, 64, 14, 6, 18, 4), INK, 0.14, 0.55, true)),
};

// a medallion per collection category: same family, different counts, so each reads as its own stamp
export function medallion(seed: number) {
  const N = 10 + seed * 2, M = 30 + seed * 6;
  return svg(200, 200, ring(200, 78, 12, N, 4, M, 9, 420) + ring(200, 46, 8, N - 4, 3, M - 12, 7, 300) + ring(200, 20, 4, 8, 2, 24, 5, 160), INK, 0.75, 0.5);
}
