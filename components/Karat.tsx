"use client";
// The purity bar: twenty-four parts, the gold ones lit. Picking a fineness fills the bar and tells where it is used.
import { useState } from "react";
import { KARATS } from "@/lib/museum";

const fa = (n: number, d = 1) => n.toLocaleString("fa-IR", { maximumFractionDigits: d, useGrouping: false });

export default function Karat() {
  const [i, setI] = useState(3); // 750, the shop's own
  const k = KARATS[i], parts = (k.fine * 24) / 1000;
  return (
    <div className="kt paper">
      <i className="corner c1" aria-hidden /><i className="corner c3" aria-hidden />
      <div className="kt-pick" role="radiogroup" aria-label="عیار">
        {KARATS.map((x, j) => (
          <button key={x.fine} type="button" role="radio" aria-checked={i === j} className={i === j ? "on" : ""} onClick={() => setI(j)}>
            <b className="num">{fa(x.fine)}</b><small>{x.name}</small>
          </button>
        ))}
      </div>
      <div className="kt-bar" aria-hidden>
        {Array.from({ length: 24 }, (_, n) => <i key={n} style={{ "--f": Math.max(0, Math.min(1, parts - n)) } as React.CSSProperties} />)}
      </div>
      <div className="kt-scale num" aria-hidden><span>۰</span><span>۶</span><span>۱۲</span><span>۱۸</span><span>۲۴</span></div>
      <div className="kt-read" aria-live="polite">
        <p className="kt-big"><b className="num leaf">{fa(k.fine)}</b><span>از هزار</span></p>
        <p className="kt-frac">یعنی <b className="num">{fa(parts)}</b> بخش طلا از <b className="num">۲۴</b> بخش، و <b className="num">{fa(k.fine / 10)}٪</b> طلای خالص.</p>
        <p className="kt-use">{k.use}</p>
      </div>
    </div>
  );
}
