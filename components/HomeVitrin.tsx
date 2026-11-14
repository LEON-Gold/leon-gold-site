"use client";
// «ویترین» on the home page (owner, 2026-11-09: before the museum): the groups first (owner, 2026-11-13: لیزری، ریخته،
// پایه جواهر، بچگانه; a tap opens that group on the showcase page, vitrin/?g=…), then every category with a photo of its
// newest piece (or its drawing, «به‌زودی»); a tap opens that category (vitrin/?c=…)
import { useEffect, useState } from "react";
import { CatGrid, GroupRow } from "@/components/hesab/Vitrin";
import { publicVitrin, VCATS_DEFAULT, VGROUPS_DEFAULT, type Showcase } from "@/lib/hesab";

export default function HomeVitrin() {
  const [s, setS] = useState<Showcase | null>(null);
  useEffect(() => { publicVitrin().then(setS, () => {}); }, []);
  return (
    <>
      <GroupRow items={s ? s.items : null} groups={s ? s.groups : VGROUPS_DEFAULT} pub href={g => g ? "vitrin/?g=" + encodeURIComponent(g) : "vitrin/"} />
      <CatGrid items={s ? s.items : null} cats={s ? s.cats : VCATS_DEFAULT} pub href={c => "vitrin/?c=" + encodeURIComponent(c)} />
      <p className="vc-all"><a className="btn btn-line" href="vitrin/">ورود به ویترین</a></p>
    </>
  );
}
