"use client";
// The museum's motion: each hall's parts rise as they come in, the rosettes drift against the scroll,
// the hall chips follow the reader, and the molten-gold clip plays only on screen.
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function MuseumMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const io = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { rootMargin: "200px" });
    document.querySelectorAll("video[data-lazy]").forEach((v) => io.observe(v));

    // the chip of the hall being read lights up, and scrolls itself into view on a phone
    const chips = [...document.querySelectorAll<HTMLAnchorElement>(".mu-chips a")];
    const halls = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      chips.forEach((c) => {
        const on = c.hash === "#" + e.target.id;
        c.classList.toggle("on", on);
        if (on) c.parentElement!.scrollTo({ left: c.offsetLeft - c.parentElement!.clientWidth / 2 + c.clientWidth / 2, behavior: "smooth" });
      });
    }), { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".mu-hall").forEach((h) => halls.observe(h));

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".mu-hero-in > *", { y: 34, opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.1, delay: 0.15 });
      gsap.from(".mu-hero-pic", { scale: 0.92, opacity: 0, duration: 1.8, ease: "expo.out", delay: 0.3 });
      document.querySelectorAll<HTMLElement>("[data-rise]").forEach((sec) => {
        const parts = sec.matches("ul, ol, dl") ? sec.children : sec.querySelectorAll(":scope > *");
        if (!parts.length) return;
        gsap.from(parts, { y: 36, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: sec, start: "top 88%", once: true } });
      });
      document.querySelectorAll<HTMLElement>(".mu-rose").forEach((r) => {
        gsap.fromTo(r, { y: -60 }, { y: 60, ease: "none", scrollTrigger: { trigger: r.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
      });
      // the cube grows to its true size against the tower
      gsap.from(".stock-cube", { scale: 0.2, transformOrigin: "50% 100%", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".stock", start: "top 75%", once: true } });
    });
    return () => { io.disconnect(); halls.disconnect(); mm.revert(); };
  }, []);
  return null;
}
