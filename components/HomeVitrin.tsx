"use client";
// «ویترین» on the home page (owner, 2026-11-09: before the museum): every category with a photo of its newest piece
// (or its drawing, «به‌زودی»); a tap opens that category on the showcase page (vitrin/?c=…)
import { useEffect, useState } from "react";
import { CatGrid } from "@/components/hesab/Vitrin";
import { publicVitrin, type VItem } from "@/lib/hesab";

export default function HomeVitrin() {
  const [items, setItems] = useState<VItem[] | null>(null);
  useEffect(() => { publicVitrin().then(setItems, () => {}); }, []);
  return (
    <>
      <CatGrid items={items} pub href={c => "vitrin/?c=" + encodeURIComponent(c)} />
      <p className="vc-all"><a className="btn btn-line" href="vitrin/">ورود به ویترین</a></p>
    </>
  );
}
