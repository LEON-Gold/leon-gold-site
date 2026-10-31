"use client";
// The shop's own pieces: ivory cards with the piece on the vault ground, its weight and today's estimate from the union feed.
// A card opens into the same full-screen case as the exhibits, with every shot of the piece and an order on WhatsApp.
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ask, estimate, gram, kindOf, type Product } from "@/lib/products";
import { fa, toman, usePrice } from "@/lib/price";
import "@/app/products.css";

// each piece's own page, relative to the home page (works under the preview's base path and on the real domain)
const pageOf = (p: Product) => "vitrin/" + p.slug + "/";

export function Price({ p }: { p: Product }) {
  const { feed } = usePrice();
  if (p.sold) return <span className="pr-price sold">فروخته شد</span>;
  const v = estimate(p, feed?.gp || 0);
  if (!p.ajrat) return <span className="pr-price">قیمت با تماس</span>;
  return <span className="pr-price"><b className="num">{v ? toman(v) : "…"}</b> تومان<small>تقریبی، با نرخ همین ساعت</small></span>;
}

export default function Products({ items }: { items: Product[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [shot, setShot] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const show = (i: number) => { setOpen(i); setShot(0); dlg.current?.showModal(); };
  const close = useCallback(() => { dlg.current?.close(); setOpen(null); }, []);
  if (!items.length) return null;
  const p = open === null ? null : items[open];

  return (
    <>
      <ul className="pr-grid" data-rise>
        {items.map((it, i) => (
          <li className={"pr-card" + (it.sold ? " is-sold" : "")} key={it.slug}>
            <button className="pr-pic" type="button" onClick={() => show(i)} aria-label={"دیدن " + it.name}>
              <i className="corner c1" aria-hidden /><i className="corner c3" aria-hidden />
              <Image src={it.shots[0].src} width={it.shots[0].w} height={it.shots[0].h} alt={it.name} sizes="(min-width: 1100px) 30vw, (min-width: 600px) 45vw, 90vw" />
            </button>
            <div className="pr-text">
              <small className="pr-kind">{kindOf(it)}</small>
              <h3><a href={pageOf(it)}>{it.name}</a></h3>
              <p>{it.line}</p>
              <div className="pr-row">
                {it.weight || it.weightNote ? <span className="pr-w num">{it.weight ? gram(it.weight) : it.weightNote}</span> : null}
                <Price p={it} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <dialog ref={dlg} className="case pr-case" onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dlg.current) close(); }} aria-label={p?.name || "ویترین"}>
        {p && (
          <div className="case-in" key={p.slug}>
            <div className="pr-shots">
              <div className="case-pic"><Image src={p.shots[shot].src} width={p.shots[shot].w} height={p.shots[shot].h} alt={p.name} sizes="70vw" /></div>
              {p.shots.length > 1 && (
                <div className="pr-thumbs">
                  {p.shots.map((s, k) => (
                    <button key={s.src} type="button" aria-label={"عکس " + fa(k + 1)} aria-current={k === shot} onClick={() => setShot(k)}>
                      <Image src={s.src} width={s.w} height={s.h} alt="" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="case-text">
              <span className="case-n">{kindOf(p)}</span>
              <h3 className="leaf">{p.name}</h3>
              <p>{p.story}</p>
              <dl className="pr-label">
                <div><dt>وزن</dt><dd className="num">{p.weight ? gram(p.weight) : p.weightNote || "به‌زودی"}</dd></div>
                <div><dt>عیار</dt><dd className="num">۷۵۰ (۱۸ عیار)</dd></div>
                {p.ajrat ? <div><dt>اجرت</dt><dd className="num">{fa(p.ajrat)}٪</dd></div> : null}
                {p.details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              <Price p={p} />
              {!p.sold && <a className="btn btn-gold pr-ask" href={ask(p)}>سفارش در واتس‌اپ</a>}
              <a className="pr-page" href={pageOf(p)}>صفحه‌ی این کار ←</a>
            </div>
            <button className="case-x" type="button" onClick={close} aria-label="بستن">×</button>
          </div>
        )}
      </dialog>
    </>
  );
}
