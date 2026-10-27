import type { Metadata } from "next";
import Image from "next/image";
import Karat from "@/components/Karat";
import Timeline from "@/components/Timeline";
import HandDraw from "@/components/HandDraw";
import MuseumMotion from "@/components/MuseumMotion";
import { EXHIBITS, MELT, WORKBOX } from "@/lib/content";
import { ASSAY, COLOURS, ELEMENT, ERAS, FACTS, HALLS, HANDS, MITHQAL, ORIGIN, SOURCES, STOCK, WORDS } from "@/lib/museum";
import "./museum.css";

export const metadata: Metadata = {
  title: "موزه‌ی طلا · لئون گلد",
  alternates: { canonical: process.env.PREVIEW_BASE ? "museum/" : "museum" },
  description: "طلا چیست، عیار چطور شمرده می‌شود، سه هزار سال طلا در ایران و فنون دست زرگر؛ با آثاری از مجموعه‌های آزاد موزه‌ها.",
  openGraph: { title: "موزه‌ی طلا · لئون گلد", description: "علم و تاریخ طلا، از ستاره‌ها تا بازار تهران.", images: [{ url: "og.jpg", width: 1200, height: 630 }], locale: "fa_IR", type: "article" },
};

// the rosette file from public/gl/ (see lib/guilloche.ts), fetched once for every rosette on the page
const Rosette = ({ className }: { className: string }) => <div className={className} aria-hidden><img src="/gl/rose.svg" alt="" width={400} height={400} loading="lazy" decoding="async" /></div>;
const Corners = () => <><i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden /></>;
const fa = (n: number) => n.toLocaleString("fa-IR");
const RHYTON = ERAS.find((e) => e.piece?.src.includes("lion-rhyton"))!.piece!;
const OXUS = EXHIBITS[1];

function HallHead({ n, id, title, line }: { n: number; id: string; title: string; line: string }) {
  return (
    <div className="mu-head" data-rise>
      <p className="mu-n"><span className="num">تالار {fa(n)}</span></p>
      <h2 id={id} className="leaf">{title}</h2>
      <p>{line}</p>
    </div>
  );
}

export default function Museum() {
  return (
    <>
      <MuseumMotion />
      <header className="bar solid mu-bar">
        <a className="bar-brand" href="../" aria-label="لئون گلد، صفحه‌ی اصلی">
          <img src="/leaf.png" alt="" width={18} height={34} />
          <span className="leaf">لئون گلد</span>
        </a>
        <span className="mu-bar-t">موزه‌ی طلا</span>
        <a className="btn btn-line mu-bar-back" href="../">بازگشت به فروشگاه</a>
      </header>

      <main>
        <section className="mu-hero" aria-labelledby="mu-h">
          <Rosette className="mu-rose mu-rose-hero" />
          <Corners />
          <div className="mu-hero-in">
            <p className="mu-latin" lang="en" dir="ltr">LEON GOLD · MUSEUM</p>
            <h1 id="mu-h" className="leaf leaf-sweep">موزه‌ی طلا</h1>
            <p className="mu-lead">طلا از برخورد ستاره‌ها می‌آید، در رودها پیدا می‌شود، و سه هزار سال است که دست زرگرهای این سرزمین به آن شکل می‌دهد. پنج تالار، از عنصر ۷۹ تا ویترین امروز.</p>
            <ol className="mu-index">
              {HALLS.map(([h, t, s], i) => (
                <li key={h}><a href={h}><span className="num">{fa(i + 1)}</span><b>{t}</b><small>{s}</small></a></li>
              ))}
            </ol>
          </div>
          <figure className="mu-hero-pic">
            <Image src={RHYTON.src} width={RHYTON.w} height={RHYTON.h} alt={RHYTON.name + "، " + RHYTON.place} priority sizes="(min-width: 900px) 46vw, 92vw" />
            <figcaption>{RHYTON.name}، هخامنشی، سده‌ی پنجم پیش از میلاد</figcaption>
          </figure>
        </section>

        <nav className="mu-chips" aria-label="تالارها">
          {HALLS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
        </nav>

        {/* ---------- Hall 1: the element ---------- */}
        <section className="mu-hall" id="m-matter" aria-labelledby="m-matter-h">
          <HallHead n={1} id="m-matter-h" title="طلا چیست" line="فلزی که نه زنگ می‌زند، نه کدر می‌شود، و از هر فلز دیگری چکش‌خوارتر است. چرا؟" />
          <div className="el-row" data-rise>
            <div className="el paper">
              <Corners />
              <span className="el-z num">{ELEMENT.z}</span>
              <span className="el-sym" lang="la" dir="ltr">{ELEMENT.sym}</span>
              <b className="el-name">{ELEMENT.name}</b>
              <span className="el-mass num">{ELEMENT.mass}</span>
              <small lang="la" dir="ltr">{ELEMENT.latin}</small>
            </div>
            <p className="el-say">
              نام لاتینش <em lang="la" dir="ltr">aurum</em> از ریشه‌ای به معنای «درخشیدن» است، هم‌ریشه با نام سپیده‌دم، و نمادش در جدول تناوبی از همین‌جاست: <b dir="ltr">Au</b>. هر اتم طلا ۷۹ پروتون دارد؛ همین عدد است که آن را طلا می‌کند، نه رنگ و نه وزن.
            </p>
          </div>
          <ul className="facts" data-rise>
            {FACTS.map((f) => (
              <li className="fact paper" key={f.title}>
                <p className="fact-big"><b className="num">{f.big}</b><small>{f.unit}</small></p>
                <h3>{f.title}</h3>
                <p>{f.line}</p>
              </li>
            ))}
          </ul>

          <h3 className="mu-sub" data-rise>طلا از کجا آمده؟</h3>
          <ol className="origin" data-rise>
            {ORIGIN.map((o, i) => (
              <li key={o.k}>
                <span className="origin-k">{o.k}</span>
                <span className="origin-n num" aria-hidden>{fa(i + 1)}</span>
                <h4>{o.t}</h4>
                <p>{o.d}</p>
              </li>
            ))}
          </ol>

          <div className="stock" data-rise>
            <svg className="stock-svg" viewBox="0 0 380 200" role="img" aria-label="مکعب همه‌ی طلای استخراج‌شده، ۲۲ متر، کنار برج آزادی، ۴۵ متر">
              <defs>
                <linearGradient id="stock-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6e7b4" /><stop offset=".5" stopColor="#d8b46a" /><stop offset="1" stopColor="#9c7433" /></linearGradient>
              </defs>
              <path className="stock-tower" d="M10 185 C60 158 92 100 100 42 L100 23 L147 23 L147 42 C155 100 187 158 237 185 Z M84 185 Q86 98 123.5 82 Q161 98 163 185 Z" fillRule="evenodd" />
              <g className="stock-cube">
                <path d="M262 106 l16 -12 h79 l-16 12 Z" fill="#f6e7b4" />
                <path d="M341 106 l16 -12 v79 l-16 12 Z" fill="#9c7433" />
                <rect x="262" y="106" width="79" height="79" fill="url(#stock-leaf)" />
              </g>
              <path className="stock-ground" d="M0 185.5 H380" />
              <path className="stock-dim" d="M250 23 V185 M246 23 h8" />
              <text x="244" y="18" className="stock-t">۴۵ متر</text>
              <text x="301" y="150" className="stock-t ink" textAnchor="middle">۲۲ متر</text>
            </svg>
            <div className="stock-text">
              <p className="stock-big"><b className="num leaf">{STOCK.tonnes}</b></p>
              <p>{STOCK.line}</p>
            </div>
          </div>

          <figure className="melt" data-rise>
            <video muted loop playsInline preload="none" data-lazy poster={MELT.poster} width={1280} height={720} aria-hidden="true">
              <source src={MELT.src} type="video/webm" />
            </video>
            <figcaption>
              <b>طلا وقتی سرد می‌شود، بلور می‌بندد</b>
              <span>در این فیلم طلای مذاب در حال سرد شدن است. شاخه‌هایی که روی سطحش می‌دوند «دندریت» نام دارند: بلورهای درخت‌مانندی که از سردترین نقطه شروع می‌کنند و رو به مذاب داغ‌تر پیش می‌روند. ساختار بلوری طلا، که اتم‌ها در آن مثل پرتقال‌های یک جعبه کنار هم چیده شده‌اند، همان چیزی است که اجازه می‌دهد لایه‌ها روی هم بلغزند و طلا زیر چکش نشکند.</span>
            </figcaption>
          </figure>
        </section>

        {/* ---------- Hall 2: purity ---------- */}
        <section className="mu-hall" id="m-assay" aria-labelledby="m-assay-h">
          <Rosette className="mu-rose mu-rose-l" />
          <HallHead n={2} id="m-assay-h" title="عیار" line="طلای خالص برای انگشتر زیادی نرم است. زرگر آن را با مس و نقره می‌آمیزد، و عیار می‌گوید در این آمیزه چقدر طلاست." />
          <div className="assay-grid">
            <div data-rise>
              <Karat />
              <p className="kt-note">در ایران عیار را به هزارم می‌گویند (۷۵۰) و در بیشتر دنیا به قیراط (۱۸). قیراط از نام دانه‌ی خرنوب آمده که روزگاری با آن وزن می‌کردند؛ سکه‌ی طلای رومی ۲۴ دانه وزن داشت، و از همان‌جا طلای خالص شد «۲۴ قیراط».</p>
            </div>
            <div className="colours" data-rise>
              <h3 className="mu-sub">رنگ‌های طلای ۷۵۰</h3>
              <p className="colours-say">سه‌چهارم هر چهار، طلای خالص است؛ آن یک‌چهارمِ دیگر رنگ را می‌سازد.</p>
              <ul>
                {COLOURS.map((c) => (
                  <li key={c.name}>
                    <span className="sw" style={{ "--c": c.hex } as React.CSSProperties} aria-hidden />
                    <div>
                      <b>{c.name}</b>
                      <div className="mix" aria-hidden>
                        {c.mix.map(([n, p]) => <i key={n} className={"m-" + n} style={{ flexGrow: +p } as React.CSSProperties} />)}
                      </div>
                      <small className="mix-t num">{c.mix.map(([n, p]) => `${n} ${fa(+p)}٪`).join(" · ")}</small>
                      <p>{c.line}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mithqal paper" data-rise>
            <Corners />
            <h3>{MITHQAL.title}</h3>
            <ol>
              {MITHQAL.steps.map(([a, b, c], i) => (
                <li key={a}><small>{a}</small><b className="num">{b}</b><span>{c}</span>{i < MITHQAL.steps.length - 1 && <i aria-hidden>←</i>}</li>
              ))}
            </ol>
            <p>{MITHQAL.line}</p>
          </div>

          <h3 className="mu-sub" data-rise>عیار را چطور می‌سنجند؟</h3>
          <div className="assay-row">
            <figure className="assay-pic" data-rise>
              <Image src={WORKBOX.src} width={WORKBOX.w} height={WORKBOX.h} alt={WORKBOX.alt} sizes="(min-width: 900px) 38vw, 92vw" />
              <figcaption>{WORKBOX.alt}؛ موزه‌ی لوور.</figcaption>
            </figure>
            <ol className="assay" data-rise>
              {ASSAY.map((a, i) => (
                <li key={a.name}><span className="num">{fa(i + 1)}</span><div><h4>{a.name}<small>{a.age}</small></h4><p>{a.line}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Hall 3: gold in Iran ---------- */}
        <section className="mu-hall" id="m-time" aria-labelledby="m-time-h">
          <HallHead n={3} id="m-time-h" title="طلا در ایران" line="از جام‌های مارلیک تا سکه‌ی بهار آزادی: سه هزار سال، و هر دوره دستی تازه در کار طلا." />
          <Timeline eras={ERAS} />
        </section>

        {/* ---------- Hall 4: the goldsmith's hands ---------- */}
        <section className="mu-hall" id="m-hands" aria-labelledby="m-hands-h">
          <Rosette className="mu-rose mu-rose-r" />
          <HallHead n={4} id="m-hands-h" title="دست زرگر" line="ابزارها عوض شده‌اند، دست‌ها نه. شش فن که از گورهای مارلیک تا کارگاه‌های امروز تهران زنده مانده‌اند." />
          <ul className="hands" data-rise>
            {HANDS.map((h, i) => (
              <li className="hand paper" key={h.name}>
                <div className="hand-top">
                  <HandDraw kind={h.draw} />
                  <span className="num">{fa(i + 1)}</span>
                </div>
                <h3>{h.name}</h3>
                <ol>{h.how.map((s) => <li key={s}>{s}</li>)}</ol>
                <p>{h.line}</p>
              </li>
            ))}
          </ul>
          <div className="hands-pics" data-rise>
            {[HANDS[2].piece!, { ...OXUS, note: "دستبند گنجینه‌ی جیحون؛ خانه‌های خالی‌اش روزی پر از سنگ و شیشه‌ی رنگی بود." }].map((p) => (
              <figure key={p.src}>
                <Image src={p.src} width={p.w} height={p.h} alt={p.name + "، " + p.place} sizes="(min-width: 900px) 40vw, 92vw" />
                <figcaption><b>{p.name}</b>{p.note}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------- Hall 5: the words ---------- */}
        <section className="mu-hall" id="m-words" aria-labelledby="m-words-h">
          <HallHead n={5} id="m-words-h" title="واژه‌نامه" line="بازار طلای تهران زبان خودش را دارد. این‌ها واژه‌هایی است که روی فاکتور و پشت ویترین می‌شنوید." />
          <dl className="words paper" data-rise>
            <Corners />
            {WORDS.map(([w, d]) => <div key={w}><dt>{w}</dt><dd>{d}</dd></div>)}
          </dl>
        </section>

        <section className="mu-end" aria-labelledby="mu-end-h">
          <Rosette className="mu-rose mu-rose-end" />
          <h2 id="mu-end-h" className="leaf" data-rise>از موزه، به ویترین</h2>
          <p data-rise>هر کار لئون گلد همان ۷۵۰ است که در تالار دوم دیدید، با وزن روی برچسب و قیمت به نرخ همان ساعت اتحادیه.</p>
          <div className="mu-end-cta" data-rise>
            <a className="btn btn-gold" href="../#collection">دیدن مجموعه</a>
            <a className="btn btn-line" href="../#price">قیمت امروز</a>
          </div>
        </section>

        <section className="mu-sources" aria-labelledby="mu-src-h">
          <h2 id="mu-src-h">منابع</h2>
          <ul>
            {SOURCES.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener">{t}</a></li>)}
          </ul>
        </section>
      </main>

      <footer className="foot">
        <Rosette className="foot-rose" />
        <img className="foot-jewel" src="/leaf.png" alt="" width={265} height={490} />
        <p className="foot-latin leaf" lang="en" dir="ltr">LEON GOLD</p>
        <p className="foot-fa">موزه‌ی طلا · تهران</p>
        <nav className="foot-links" aria-label="پیوندها">
          {HALLS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
          <a href="../">فروشگاه</a>
        </nav>
        <p className="foot-credit">
          آثار تاریخی از مجموعه‌های آزاد موزه‌ها؛ هیچ‌کدام کار لئون گلد نیست:{" "}
          {[...ERAS.flatMap((e) => (e.piece ? [e.piece] : [])), HANDS[2].piece!, OXUS, WORKBOX, MELT]
            .filter((x, i, a) => a.findIndex((y) => y.credit === x.credit) === i)
            .map((x, i) => <span key={x.credit}>{i ? " · " : ""}<a href={x.page} dir="ltr">{x.credit}</a></span>)}
        </p>
      </footer>
    </>
  );
}
