// Persian number, the same on the server and in every browser (hydration #418: Node, Chrome and Safari format "fa-IR"
// with different separators). en-US is identical everywhere; then Persian digits and the Persian separators ٬ and ٫.
// No "use client": server pages (home, museum) call it too.
export const fa = (n: number, d = 0, group = true) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0, useGrouping: group })
    .replace(/[,.]/g, (c) => (c === "," ? "\u066C" : "\u066B")).replace(/\d/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
