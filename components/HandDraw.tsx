// Small line drawings for the goldsmith's techniques, in the engraver's gold hairline.
const D: Record<string, React.ReactNode> = {
  // a crucible tipping molten gold into a flask
  cast: <>
    <path d="M18 30 L44 22 L48 38 L24 46 Z" />
    <path d="M46 30 q10 2 12 14" strokeDasharray="2 3" />
    <rect x="44" y="50" width="30" height="34" rx="3" />
    <path d="M54 50 v-4 h10 v4" />
    <path d="M59 58 c-6 6 6 10 0 16 c-4 4 4 6 0 8" className="fill" />
  </>,
  // a hammer driving a punch into a sheet on pitch
  chase: <>
    <path d="M12 74 h72" /><path d="M12 80 q12 -4 24 0 t24 0 t24 0" />
    <path d="M30 74 q8 -12 16 0" className="fill" />
    <path d="M38 64 L44 28" /><path d="M41 28 h6" />
    <rect x="34" y="12" width="26" height="10" rx="2" transform="rotate(-18 47 17)" /><path d="M54 18 L74 40" />
  </>,
  // grains of gold on a sheet
  grain: <>
    <path d="M14 72 q34 -14 68 0" />
    {[[28, 60], [38, 56], [48, 55], [58, 56], [68, 60], [33, 48], [43, 46], [53, 46], [63, 48], [38, 37], [48, 36], [58, 37], [48, 27]].map(([x, y], i) =>
      <circle key={i} cx={x} cy={y} r="4.2" className="fill" />)}
  </>,
  // two wires twisted, then curled into a scroll
  filigree: <>
    <path d="M10 22 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" /><path d="M10 22 q6 6 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" />
    <path d="M48 82 c-22 0 -24 -30 -6 -30 c12 0 12 16 2 16 c-6 0 -6 -8 0 -8" />
    <path d="M48 82 c22 0 24 -30 6 -30 c-12 0 -12 16 -2 16 c6 0 6 -8 0 -8" />
  </>,
  // a stone held in four claws
  set: <>
    <path d="M30 40 L48 26 L66 40 L48 70 Z" className="fill" /><path d="M30 40 h36 M40 40 L48 26 L56 40 M40 40 L48 70 L56 40" />
    <path d="M30 40 q-4 -8 2 -14 M66 40 q4 -8 -2 -14" /><path d="M36 58 q-8 4 -8 14 h40 q0 -10 -8 -14" />
    <path d="M28 84 h40" />
  </>,
  // cells filled with glass, one still empty
  enamel: <>
    <rect x="14" y="20" width="68" height="60" rx="8" />
    <path d="M14 50 h68 M48 20 v60" />
    <circle cx="31" cy="35" r="9" className="fill" /><circle cx="65" cy="35" r="9" className="fill soft" /><circle cx="31" cy="65" r="9" className="fill soft" /><circle cx="65" cy="65" r="9" />
  </>,
};

export default function HandDraw({ kind }: { kind: string }) {
  return <svg className="hd" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{D[kind]}</svg>;
}
