"use client";
// Section titles settle word by word out of a soft blur as they come into view (by word, never by letter: Persian
// letters must stay joined), and four thin gold dashes on the page's edge fill as the page is read, a quarter each.
// Reduced motion: the titles stand still and the dashes still fill.
import { useEffect, useRef } from "react";

export default function Titles() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const off: (() => void)[] = [];
    if (matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      const heads = [...document.querySelectorAll<HTMLElement>(".sec-head h2")];
      for (const h of heads) {
        let i = 0;
        for (const n of [...h.childNodes]) {
          if (n.nodeType !== 3 || !n.textContent!.trim()) continue;
          const f = document.createDocumentFragment();
          for (const part of n.textContent!.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { f.append(part); continue; }
            const w = document.createElement("span"); w.className = "tw"; w.style.setProperty("--i", String(i++)); w.textContent = part; f.append(w);
          }
          n.replaceWith(f);
        }
        h.classList.add("tw-wait");
      }
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("tw-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
      heads.forEach((h) => io.observe(h));
      off.push(() => io.disconnect());
    }
    const b = bar.current!;
    let raf = 0;
    const fill = () => { raf = 0; const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      b.querySelectorAll<HTMLElement>("i").forEach((d, k) => d.style.setProperty("--f", String(Math.min(1, Math.max(0, p * 4 - k))))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(fill); };
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on); fill();
    off.push(() => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); });
    return () => off.forEach((f) => f());
  }, []);
  return <div ref={bar} className="dashes" aria-hidden><i /><i /><i /><i /></div>;
}
