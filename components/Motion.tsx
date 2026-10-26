"use client";
// The motion layer: the wordmark settles as the first screen leaves (the signature move), and every section's parts rise in turn as it enters.
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Motion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(".hero-name", { scale: 0.93, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.fromTo(".hero-pic img", { scale: 1.06 }, { scale: 1, duration: 2.4, ease: "power2.out" });

      document.querySelectorAll<HTMLElement>("[data-rise]").forEach((sec) => {
        const parts = sec.querySelectorAll<HTMLElement>(":scope > *, [data-part]");
        gsap.from(parts, { y: 24, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: sec, start: "top 82%", once: true } });
      });

      gsap.from(".board-row", { y: 16, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.05, scrollTrigger: { trigger: ".board", start: "top 80%", once: true } });
    });
    // a silent loop is decoration: with reduced motion it rests on its poster
    mm.add("(prefers-reduced-motion: reduce)", () => { document.querySelectorAll("video").forEach((v) => v.pause()); });
    return () => mm.revert();
  }, []);
  return null;
}
