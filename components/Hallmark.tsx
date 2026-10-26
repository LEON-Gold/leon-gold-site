// The assay hallmark: a round stamp with its legend running around the rim and the fineness struck in the middle,
// the mark every piece of 18k gold carries. It turns very slowly where it is placed.
export default function Hallmark({ className = "" }: { className?: string }) {
  return (
    <svg className={"hallmark " + className} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <path id="hm-rim" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="96" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="90" strokeWidth=".6" />
        <circle cx="100" cy="100" r="62" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="57" strokeWidth=".6" strokeDasharray="1 3" />
      </g>
      <text fill="currentColor" fontFamily="Cinzel, serif" fontSize="13.5" letterSpacing="4.2">
        <textPath href="#hm-rim">LEON GOLD · TEHRAN · ASSAY 750 · SINCE 1988 ·</textPath>
      </text>
      <text x="100" y="112" textAnchor="middle" fill="currentColor" fontFamily="Vazirmatn, sans-serif" fontWeight="800" fontSize="40">۷۵۰</text>
      <text x="100" y="134" textAnchor="middle" fill="currentColor" fontFamily="Vazirmatn, sans-serif" fontSize="12">عیار</text>
    </svg>
  );
}
