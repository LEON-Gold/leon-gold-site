"use client";
// The lion-in-gold exhibits. Each frame opens into a full-screen case: the piece large on the vault ground,
// its label beside it, arrows (and the keyboard) to walk to the next case.
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Exhibit } from "@/lib/content";

export default function Exhibits({ items }: { items: Exhibit[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const show = (i: number) => { setOpen(i); dlg.current?.showModal(); };
  const close = useCallback(() => { dlg.current?.close(); setOpen(null); }, []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (open === null) return;
      if (e.key === "ArrowLeft") step(1);
      if (e.key === "ArrowRight") step(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, step]);

  const x = open === null ? null : items[open];
  return (
    <>
      <ol className="exhibits" data-rise>
        {items.map((it, i) => (
          <li className={"ex ex" + i} key={it.src}>
            <figure>
              <button className="ex-frame" type="button" onClick={() => show(i)} aria-label={"دیدن بزرگ‌تر: " + it.name}>
                <i className="corner c1" aria-hidden /><i className="corner c3" aria-hidden />
                <Image src={it.src} width={it.w} height={it.h} alt={it.name + "، " + it.place} sizes="(min-width: 900px) 33vw, 80vw" />
                <span className="ex-zoom" aria-hidden>+</span>
              </button>
              <figcaption><b>{it.name}</b><span>{it.note}</span><em>{it.place}</em></figcaption>
            </figure>
          </li>
        ))}
      </ol>

      <dialog ref={dlg} className="case" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dlg.current) close(); }} aria-label="ویترین">
        {x && (
          <div className="case-in" key={x.src}>
            <div className="case-pic"><Image src={x.src} width={x.w} height={x.h} alt={x.name + "، " + x.place} sizes="70vw" /></div>
            <div className="case-text">
              <span className="case-n num">{(open! + 1).toLocaleString("fa-IR")} از {items.length.toLocaleString("fa-IR")}</span>
              <h3 className="leaf">{x.name}</h3>
              <p>{x.note}</p>
              <em>{x.place}</em>
              <a href={x.page} target="_blank" rel="noopener" dir="ltr">{x.credit}</a>
              <div className="case-nav">
                <button type="button" onClick={() => step(-1)} aria-label="قبلی">→</button>
                <button type="button" onClick={() => step(1)} aria-label="بعدی">←</button>
              </div>
            </div>
            <button className="case-x" type="button" onClick={close} aria-label="بستن">×</button>
          </div>
        )}
      </dialog>
    </>
  );
}
