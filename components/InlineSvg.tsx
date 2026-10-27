"use client";
import { useEffect, useRef } from "react";

// An SVG file from public/gl/ put inline after the page loads, so CSS can animate its lines (the hero's engraving rosette)
// while the page's HTML stays light.
export default function InlineSvg({ src, className }: { src: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    fetch(src).then((r) => r.text()).then((svg) => { if (live && ref.current) ref.current.innerHTML = svg; }).catch(() => {});
    return () => { live = false; };
  }, [src]);
  return <div ref={ref} className={className} aria-hidden />;
}
