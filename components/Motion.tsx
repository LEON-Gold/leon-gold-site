"use client";
// The motion layer. The vault opens on the jewel alone, large and centred. Scrolling turns it once about its
// upright axis while it settles into place, then the names and the actions rise. The hero holds still (pinned)
// for that turn. After that, every section's parts rise in turn as they
// enter, the rosettes drift against the scroll, and the plaques tip toward the pointer.
// A wheel or trackpad scroll is eased by Lenis, slower than the native step, so even a hard flick moves the page
// (and everything tied to it) in one smooth glide. Touch keeps the phone's own momentum (no Lenis there). The jewel's
// fade-in is CSS (site.css .jw) so the largest paint does not wait for this script.
// GSAP, ScrollTrigger and Lenis are fetched only once the hydrated page leaves the phone idle,
// so their parsing does not block the first paint; until then html.mo-wait (site.css) holds the intro's parts hidden.
import { useEffect } from "react";
import "lenis/dist/lenis.css";

export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("mo-wait");
    let undo = () => {}, dead = false;
    const idle = new Promise((ok) => ("requestIdleCallback" in window ? requestIdleCallback(ok, { timeout: 700 }) : setTimeout(ok, 200)));
    idle.then(() => Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")])).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
      if (dead) return;
      root.classList.remove("mo-wait");
      undo = start(gsap, ScrollTrigger, Lenis);
    }, () => root.classList.remove("mo-wait"));
    return () => { dead = true; root.classList.remove("mo-wait"); undo(); };
  }, []);
  return null;
}

type G = typeof import("gsap")["gsap"];
type ST = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];
type L = typeof import("lenis")["default"];

function start(gsap: G, ScrollTrigger: ST, Lenis: L) {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Lenis only eases wheels and trackpads; on a touch-only phone it would run every frame for nothing
    const lenis = matchMedia("(hover: hover) and (pointer: fine)").matches ? new Lenis({ lerp: 0.075, wheelMultiplier: 0.8, anchors: true, prevent: (n) => !!n.closest?.(".sheet, .case") }) : null;
    lenis?.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis!.raf(t * 1000);
    if (lenis) { gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0); }

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero-rose.r1", { scale: 0.86, duration: 3.2 }, 0)
      .from(".hero-cue", { opacity: 0, duration: 1 }, 1.4)
      .from(".hero .corner", { opacity: 0, scale: 0.6, duration: 1, stagger: 0.06 }, 1.1);

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
    gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".hero", start: "top top", end: "+=200%", pin: true, scrub: 1.2, invalidateOnRefresh: true } })
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
      gsap.fromTo(r, { y: -60 }, { y: 60, ease: "none", scrollTrigger: { trigger: r.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
    });
    // fonts and photos arriving late move everything down; measure again so no part waits forever unrevealed
    const refresh = () => ScrollTrigger.refresh();
    addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => { removeEventListener("load", refresh); if (lenis) { gsap.ticker.remove(tick); lenis.destroy(); } };
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
}
