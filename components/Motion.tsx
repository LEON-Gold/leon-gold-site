"use client";
// The motion layer. The vault opens on the jewel alone, large and centred. Scrolling turns it once about its
// upright axis while it settles into place, then the names and the actions rise. The hero holds still (pinned)
// for that turn. After that, every section's parts rise in turn as they
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
      tl.from(".hero-rose.r1", { scale: 0.86, duration: 3.2 }, 0)
        .from(".hero-rose.r2", { scale: 0.4, opacity: 0, duration: 2 }, 0.15)
        .from(".jw", { opacity: 0, duration: 1.6 }, 0.3)
        .from(".hero-cue", { opacity: 0, duration: 1 }, 1.4)
        .from(".hero .corner", { opacity: 0, scale: 0.6, duration: 1, stagger: 0.06 }, 1.1)
        .from(".ticker", { y: 58, duration: 1.1 }, 1.2)
        // clearProps: a leftover transform on the bar would trap the fixed menu panel inside it
        .from(".bar", { y: -30, opacity: 0, duration: 1, clearProps: "transform,opacity" }, 0.9);

      // the molten-gold clip loads and plays only while it is on screen
      const io = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { rootMargin: "200px" });
      document.querySelectorAll("video[data-lazy]").forEach((v) => io.observe(v));

      // the lamp follows the pointer
      const hero = document.querySelector<HTMLElement>(".hero");
      const lamp = (e: PointerEvent) => { const r = hero!.getBoundingClientRect(); hero!.style.setProperty("--mx", e.clientX - r.left + "px"); hero!.style.setProperty("--my", e.clientY - r.top + "px"); };
      hero?.addEventListener("pointermove", lamp);

      // the jewel turns on the scroll: large in the middle of the screen, one full turn while it shrinks into its
      // place above the name, then the names and actions rise
      const jewel = document.querySelector<HTMLElement>(".hero-jewel")!;
      const toMiddle = () => { const h = jewel.closest(".hero")!.getBoundingClientRect(), j = jewel.getBoundingClientRect(); return h.top + h.height * 0.45 - (j.top + j.height / 2 - Number(gsap.getProperty(jewel, "y"))); };
      const words = [".hero-latin", ".hero-name", ".hero-cta .btn"];
      gsap.set(words, { opacity: 0, y: 30 });
      gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".hero", start: "top top", end: "+=140%", pin: true, scrub: 0.6, invalidateOnRefresh: true } })
        .to(".hero-cue", { opacity: 0, duration: 0.08 }, 0)
        .fromTo(jewel, { y: toMiddle, scale: 1.9 }, { y: 0, scale: 1, duration: 0.6, ease: "power1.inOut" }, 0)
        .fromTo(".jw", { rotationY: 0 }, { rotationY: 360, duration: 0.6, ease: "power1.inOut" }, 0)
        .to(words, { opacity: 1, y: 0, duration: 0.2, stagger: 0.07, ease: "power2.out" }, 0.55)
        .to({}, { duration: 0.1 });

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
