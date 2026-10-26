"use client";
// The motion layer. One orchestrated moment, the vault opening: the rosettes grow in, the jewel descends, the
// names rise under their leaf sweep, the actions arrive. After that, every section's parts rise in turn as they
// enter, the rosettes drift against the scroll, and the plaques tip toward the pointer.
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Motion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-rose.r1", { scale: 0.7, opacity: 0, duration: 2.4 }, 0)
        .from(".hero-rose.r2", { scale: 0.4, opacity: 0, duration: 2 }, 0.15)
        .from(".hero-jewel", { y: -40, opacity: 0, scale: 0.85, duration: 1.6 }, 0.3)
        .from(".hero-latin", { y: 24, opacity: 0, duration: 1.2 }, 0.55)
        .from(".hero-name", { y: 40, opacity: 0, duration: 1.4 }, 0.65)
        .from(".hero-tag, .hero-sub", { y: 18, opacity: 0, duration: 1, stagger: 0.1 }, 0.95)
        .from(".hero-cta .btn", { y: 16, opacity: 0, duration: 0.9, stagger: 0.08 }, 1.15)
        .from(".hero .corner", { opacity: 0, scale: 0.6, duration: 1, stagger: 0.06 }, 1.1)
        .from(".ticker", { y: 58, duration: 1.1 }, 1.2)
        // clearProps: a leftover transform on the bar would trap the fixed menu panel inside it
        .from(".bar", { y: -30, opacity: 0, duration: 1, clearProps: "transform,opacity" }, 0.9);

      // the hero sinks a little as it leaves
      gsap.to(".hero-in", { y: 120, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

      document.querySelectorAll<HTMLElement>("[data-rise]").forEach((sec) => {
        const parts = sec.matches("ul, ol") ? sec.children : sec.querySelectorAll(":scope > *");
        gsap.from(parts, { y: 36, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: sec, start: "top 85%", once: true } });
      });
      gsap.from(".plaque, .calc, .pp-board", { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".pp", start: "top 85%", once: true } });

      document.querySelectorAll<HTMLElement>(".her-rose, .order-rose, .foot-rose").forEach((r) => {
        gsap.fromTo(r, { y: -60 }, { y: 60, ease: "none", scrollTrigger: { trigger: r.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });

    // plaques and exhibit frames tip toward a mouse pointer
    mm.add("(hover: hover) and (prefers-reduced-motion: no-preference)", () => {
      const els = document.querySelectorAll<HTMLElement>(".plaque, .ex-frame");
      const off: (() => void)[] = [];
      els.forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(el, { rotateY: x * 8, rotateX: -y * 8, transformPerspective: 900, duration: 0.6, ease: "power2.out" });
        };
        const leave = () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "power3.out" });
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        off.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });
      return () => off.forEach((f) => f());
    });

    // a silent loop is decoration: with reduced motion it rests on its poster
    mm.add("(prefers-reduced-motion: reduce)", () => { document.querySelectorAll("video").forEach((v) => v.pause()); });
    return () => mm.revert();
  }, []);
  return null;
}
