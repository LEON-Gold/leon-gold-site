"use client";
// Three thousand years of gold in Iran, one stop per era. Pieces with a free photograph sit beside their stop and open
// into the same full-screen display case as the home page's lions, walking only through the pieces.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Era, Piece } from "@/lib/museum";

const fa = (n: number) => n.toLocaleString("fa-IR");

export default function Timeline({ eras }: { eras: Era[] }) {
  const pieces = eras.map((e) => e.piece).filter(Boolean) as Piece[];
  const [open, setOpen] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const show = (p: Piece) => { setOpen(pieces.indexOf(p)); dlg.current?.showModal(); };
  const n = pieces.length;
  const close = () => { dlg.current?.close(); setOpen(null); };
  const step = (d: number) => setOpen((o) => (o === null ? o : (o + d + n) % n));

  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => {
      const d = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
      if (d) setOpen((o) => (o === null ? o : (o + d + n) % n));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, n]);

  const x = open === null ? null : pieces[open];
  return (
    <>
      <ol className="tl">
        {eras.map((e) => (
          <li className={"tl-stop" + (e.piece ? " has-pic" : "")} key={e.title} data-rise>
            <div className="tl-when"><span className="num">{e.year}</span><em>{e.era}</em></div>
            <div className="tl-body">
              <h3>{e.title}</h3>
              <p>{e.line}</p>
            </div>
            {e.piece && (
              <figure className="tl-pic">
                <button className="ex-frame" type="button" onClick={() => show(e.piece!)} aria-label={"دیدن بزرگ‌تر: " + e.piece.name}>
                  <i className="corner c1" aria-hidden /><i className="corner c3" aria-hidden />
                  <Image src={e.piece.src} width={e.piece.w} height={e.piece.h} alt={e.piece.name + "، " + e.piece.place} sizes="(min-width: 900px) 30vw, 86vw" />
                  <span className="ex-zoom" aria-hidden>+</span>
                </button>
                <figcaption>{e.piece.name}<small>{e.piece.place}</small></figcaption>
              </figure>
            )}
          </li>
        ))}
      </ol>

      <dialog ref={dlg} className="case" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dlg.current) close(); }} aria-label="ویترین">
        {x && (
          <div className="case-in" key={x.src}>
            <div className="case-pic"><Image src={x.src} width={x.w} height={x.h} alt={x.name + "، " + x.place} sizes="70vw" /></div>
            <div className="case-text">
              <span className="case-n num">{fa(open! + 1)} از {fa(pieces.length)}</span>
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
