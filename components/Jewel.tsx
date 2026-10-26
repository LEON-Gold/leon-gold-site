// Line drawings of each collection category, engraved in gold leaf on an ivory card. They stand in for photographs
// until the owner's own product shots arrive, and are drawn in one hand: 1.6px gold strokes, round joins, one stone.
const KINDS: Record<string, React.ReactNode> = {
  ring: (
    <>
      <ellipse cx="100" cy="128" rx="54" ry="20" />
      <ellipse cx="100" cy="128" rx="44" ry="14" />
      <path d="M46 128c0 26 24 40 54 40s54-14 54-40" />
      <path d="M56 128c0 18 20 29 44 29s44-11 44-29" opacity=".55" />
      <path d="M84 110l-8-18h48l-8 18" />
      <path d="M76 92l24-26 24 26z" className="stone" />
      <path d="M76 92h48M88 92l12-26 12 26M100 66v26" opacity=".7" />
    </>
  ),
  necklace: (
    <>
      <path d="M30 34c8 62 38 92 70 96 32-4 62-34 70-96" strokeDasharray="1 6" strokeWidth="3.2" />
      <path d="M30 34c8 62 38 92 70 96 32-4 62-34 70-96" opacity=".35" />
      <path d="M100 130v8" />
      <path d="M100 138c-14 14-16 28-6 38a9 9 0 0 0 12 0c10-10 8-24-6-38z" className="stone" />
      <circle cx="100" cy="164" r="4" />
    </>
  ),
  bracelet: (
    <>
      <ellipse cx="100" cy="104" rx="70" ry="44" />
      <ellipse cx="100" cy="104" rx="58" ry="34" />
      <path d="M30 104v14c0 24 31 44 70 44s70-20 70-44v-14" />
      {[-48, -24, 0, 24, 48].map((x) => <circle key={x} cx={100 + x} cy={104 + 44 * Math.sqrt(1 - (x / 70) ** 2) + 6} r="3.4" className="stone" />)}
    </>
  ),
  earring: (
    <>
      {[62, 138].map((x) => (
        <g key={x}>
          <path d={`M${x} 30c-14 0-18 16-8 22`} />
          <circle cx={x} cy="58" r="6" />
          <path d={`M${x} 64v10`} />
          <path d={`M${x} 74l-16 26 16 34 16-34z`} className="stone" />
          <path d={`M${x - 16} 100h32M${x} 74v60`} opacity=".6" />
        </g>
      ))}
    </>
  ),
  set: (
    <>
      <path d="M40 30c6 46 30 70 60 72 30-2 54-26 60-72" strokeDasharray="1 6" strokeWidth="3" />
      <path d="M100 102c-10 10-12 22-4 30a6 6 0 0 0 8 0c8-8 6-20-4-30z" className="stone" />
      <ellipse cx="100" cy="166" rx="46" ry="12" />
      <path d="M54 166c0 10 20 18 46 18s46-8 46-18" opacity=".6" />
      <circle cx="28" cy="120" r="5" /><path d="M28 125l-8 14 8 16 8-16z" className="stone" />
      <circle cx="172" cy="120" r="5" /><path d="M172 125l-8 14 8 16 8-16z" className="stone" />
    </>
  ),
  coin: (
    <>
      <circle cx="100" cy="100" r="66" />
      <circle cx="100" cy="100" r="58" />
      <circle cx="100" cy="100" r="54" strokeDasharray="1 4" opacity=".7" />
      <circle cx="100" cy="86" r="14" className="stone" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${100 + Math.cos(a) * 19} ${86 + Math.sin(a) * 19}L${100 + Math.cos(a) * 27} ${86 + Math.sin(a) * 27}`} />;
      })}
      <path d="M64 132c10-10 22-14 36-14s26 4 36 14" />
      <path d="M70 140h60" opacity=".6" />
    </>
  ),
};

export default function Jewel({ kind, id }: { kind: keyof typeof KINDS | string; id: string }) {
  const g = `jg-${id}`;
  return (
    <svg className="jewel" viewBox="0 0 200 200" aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9c7433" /><stop offset=".38" stopColor="#e9cf86" /><stop offset=".55" stopColor="#b8893e" /><stop offset="1" stopColor="#7a5a24" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${g})`} strokeWidth="1.8" style={{ ["--stone" as string]: `url(#${g})` }}>
        {KINDS[kind] ?? KINDS.ring}
      </g>
    </svg>
  );
}
