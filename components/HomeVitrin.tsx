"use client";
// «ویترین» on the home page (owner, 2026-11-09: before the museum): big tiles for the groups (owner, 2026-11-13: همه،
// لیزری، ریخته، پایه جواهر، بچگانه), each with a photo of its newest piece (or a drawing, «به‌زودی»); a tap opens that group
// on the showcase page (vitrin/?g=…), with its categories and pieces
import { useEffect, useState } from "react";
import { GroupGrid, kidsNameOf } from "@/components/hesab/Vitrin";
import { publicVitrin, VGROUPS_DEFAULT, type Showcase } from "@/lib/hesab";

export default function HomeVitrin() {
  const [s, setS] = useState<Showcase | null>(null);
  useEffect(() => { publicVitrin().then(setS, () => {}); }, []);
  return (
    <>
      <GroupGrid items={s ? s.items : null} groups={s ? s.groups : VGROUPS_DEFAULT} pub href={g => g === kidsNameOf(s ? s.groups : VGROUPS_DEFAULT) ? "kids/" : "vitrin/?g=" + encodeURIComponent(g)} />
      <p className="vc-all"><a className="btn btn-line" href="vitrin/">ورود به ویترین</a></p>
    </>
  );
}
