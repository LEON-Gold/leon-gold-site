// The assay hallmark: a round stamp with its legend running around the rim and the fineness struck in the middle,
// the mark every piece of 18k gold carries. It turns very slowly where it is placed.
import { useId } from "react";

export default function Hallmark({ className = "" }: { className?: string }) {
  const rim = "hm" + useId().replace(/:/g, "");
  return (
    <svg className={"hallmark " + className} viewBox="0 0 200 200" aria-hidden>
      <defs>
        <path id={rim} d="M100 100m-77 0a77 77 0 1 1 154 0a77 77 0 1 1-154 0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="96" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="91" strokeWidth=".6" />
        <circle cx="100" cy="100" r="62" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="57" strokeWidth=".6" strokeDasharray="1 3" />
      </g>
      {/* the page is right-to-left; a left-to-right legend would otherwise run off the start of its path */}
      <text direction="ltr" fill="currentColor" fontFamily="Cinzel, serif" fontSize="12" letterSpacing="2" dy="4">
        <textPath href={"#" + rim} textLength="470" lengthAdjust="spacing">LEON GOLD · TEHRAN · ASSAY 750 · SINCE 1988 ·</textPath>
      </text>
      <text x="100" y="112" textAnchor="middle" fill="currentColor" fontFamily="Vazirmatn, sans-serif" fontWeight="800" fontSize="40">۷۵۰</text>
      <text x="100" y="134" textAnchor="middle" fill="currentColor" fontFamily="Vazirmatn, sans-serif" fontSize="12">عیار</text>
    </svg>
  );
}
