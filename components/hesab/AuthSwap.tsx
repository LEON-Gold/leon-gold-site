"use client";
// «ورود» ⇄ «ثبت نام» in «حساب من» (owner, 2026-11-09, from a reference video): on a desktop the card is two halves, the
// form on one and an emerald panel with a slanted edge on the other; switching slides the panel across, over the form,
// and the other form appears on the other side. On a phone (no room for two halves) an emerald band with the same slant
// sweeps over the card and the form changes under it. With «reduce motion» the forms just change.
import { useRef, useState, type ReactNode } from "react";

type Mode = "in" | "up";
const SLIDE = 760, SWAP = 360;

export default function AuthSwap({ render, onSwap, start = "in" }: { render: (mode: Mode, go: (m: Mode) => void) => ReactNode; onSwap?: () => void; start?: Mode }) {
  const [mode, setMode] = useState<Mode>(start);   // the form shown (an invite link opens on «ثبت نام»)
  const [side, setSide] = useState<Mode>(start);   // where the panel is going
  const [moving, setMoving] = useState(false);
  const busy = useRef(false);
  const go = (m: Mode) => {
    if (busy.current || m === side) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) { setSide(m); setMode(m); onSwap?.(); return; }
    busy.current = true; setSide(m); setMoving(true);
    setTimeout(() => { setMode(m); onSwap?.(); }, SWAP);
    setTimeout(() => { setMoving(false); busy.current = false; }, SLIDE + 40);
  };
  const toUp = side === "in";
  return (
    <div className={"hs-auth" + (moving ? " is-moving" : "")} data-mode={mode} data-side={side}>
      <div className="hs-auth-form">{render(mode, go)}</div>
      <aside className="hs-auth-panel" aria-label={toUp ? "ثبت نام" : "ورود"}>
        <img src="/leaf.webp" alt="" width={40} height={74} />
        <p className="hs-auth-k" lang="en" dir="ltr">LEON GOLD</p>
        <h2 className="hs-auth-t">{toUp ? "خوش برگشتید" : "به لئون گلد بپیوندید"}</h2>
        <p className="hs-auth-p">{toUp ? "حساب طلایی و ریالی، سفارش‌ها و ویترینِ با قیمت روز، همه در یک جا." : "یک دقیقه تا حساب خودتان: ویترین با قیمت همین ساعت، سفارش و صورتحساب."}</p>
        <p className="hs-auth-q">{toUp ? "حساب ندارید؟" : "حساب دارید؟"}</p>
        <button type="button" className="btn btn-line hs-auth-b" onClick={() => go(toUp ? "up" : "in")}>{toUp ? "ثبت نام" : "ورود"}</button>
      </aside>
      <i className="hs-auth-sweep" aria-hidden />
    </div>
  );
}
