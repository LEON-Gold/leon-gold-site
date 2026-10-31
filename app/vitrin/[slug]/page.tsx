// Each showcase piece's own page (vitrin/<slug>/), built statically from lib/products.ts: every shot, the copy,
// the label, today's estimate and the WhatsApp order, with its own title, share card and structured data.
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Price } from "@/components/Products";
import Ruler from "@/components/Ruler";
import { PRODUCTS, ask, codeOf, gram, kindOf, type Product } from "@/lib/products";
import { SHOP } from "@/lib/content";
import "../vitrin.css";

const SITE = (process.env.SITE_URL || "https://leon-gold.github.io/leon-gold-app/site/").replace(/\/?$/, "/");
const path = (slug: string) => "vitrin/" + slug + (process.env.PREVIEW_BASE ? "/" : "");
const fa = (n: number) => n.toLocaleString("fa-IR");
const find = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

const describe = (p: Product) => `${p.name}، ${kindOf(p)}: ${p.line.replace(/\.$/, "")}. طلای ۱۸ عیار از لئون گلد در تهران، با قیمت روز اتحادیه و سفارش در واتس‌اپ.`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = find((await params).slug);
  if (!p) return {};
  const title = `${p.name} · طلای ۱۸ عیار · لئون گلد`;
  return {
    title,
    description: describe(p),
    alternates: { canonical: path(p.slug) },
    openGraph: { siteName: SHOP.name, title, description: p.line, url: path(p.slug), images: [{ url: `products/${p.slug}/og.jpg`, width: 1200, height: 630, alt: p.name }], locale: "fa_IR", type: "website" },
    twitter: { card: "summary_large_image", images: [`products/${p.slug}/og.jpg`] },
  };
}

// schema.org Product with only what is true: no offer or price until the owner gives weight and ajrat
function productLd(p: Product) {
  const url = SITE + path(p.slug);
  const code = codeOf(p);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product", "@id": url + "#product", url, name: p.name, description: p.line + " " + p.story,
        image: p.shots.map((s) => SITE + s.src.slice(1)), category: p.kind, material: "طلای ۱۸ عیار (۷۵۰)",
        ...(code ? { sku: code } : {}),
        ...(p.weight ? { weight: { "@type": "QuantitativeValue", value: p.weight, unitCode: "GRM" } } : {}),
        additionalProperty: p.details.filter(([k]) => k !== "کد").map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SHOP.name, item: SITE },
          { "@type": "ListItem", position: 2, name: "ویترین", item: SITE + "#products" },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
    ],
  };
}

const Corners = () => <><i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden /></>;

export default async function Piece({ params }: { params: Promise<{ slug: string }> }) {
  const p = find((await params).slug);
  if (!p) notFound();
  const others = PRODUCTS.filter((o) => o.slug !== p.slug);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd(p)).replace(/</g, "\\u003c") }} />
      <Ruler />
      <header className="bar solid vt-bar">
        <a className="bar-brand" href="../../" aria-label="لئون گلد، صفحه‌ی اصلی">
          <img src="/leaf.webp" alt="" width={18} height={34} />
          <span className="leaf">لئون گلد</span>
        </a>
        <span className="vt-bar-t">ویترین</span>
        <a className="btn btn-line vt-bar-back" href="../../#products">همه‌ی ویترین</a>
      </header>

      <main className="vt">
        <nav className="vt-crumbs" aria-label="مسیر">
          <a href="../../">لئون گلد</a><i aria-hidden>◆</i><a href="../../#products">ویترین</a><i aria-hidden>◆</i><span aria-current="page">{p.name}</span>
        </nav>

        <article className="vt-piece">
          <div className="vt-shots">
            {p.shots.map((s, i) => (
              <figure className="vt-shot" key={s.src}>
                <Corners />
                <Image src={s.src} width={s.w} height={s.h} alt={i ? `${p.name}، نمای ${fa(i + 1)}` : p.name} sizes="(min-width: 900px) 50vw, 100vw" priority={i === 0} />
              </figure>
            ))}
          </div>

          <div className="vt-text">
            <Corners />
            <p className="vt-kind">{kindOf(p)}</p>
            <h1 className="leaf">{p.name}</h1>
            <p className="vt-line">{p.line}</p>
            <p className="vt-story">{p.story}</p>
            <dl className="pr-label">
              <div><dt>وزن</dt><dd className="num">{p.weight ? gram(p.weight) : "با تماس"}</dd></div>
              <div><dt>عیار</dt><dd className="num">۷۵۰ (۱۸ عیار)</dd></div>
              {p.ajrat ? <div><dt>اجرت</dt><dd className="num">{fa(p.ajrat)}٪</dd></div> : null}
              {p.details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <div className="vt-buy">
              <Price p={p} />
              {!p.sold && <a className="btn btn-gold" href={ask(p)}>سفارش در واتس‌اپ</a>}
            </div>
            <p className="vt-note">قیمت با نرخ تابلوی اتحادیه‌ی طلای تهران در همین ساعت و اجرت همین کار حساب می‌شود؛ وزن دقیق و فاکتور هنگام تحویل در فروشگاه.</p>
          </div>
        </article>

        {others.length > 0 && (
          <section className="vt-more" aria-labelledby="vt-more-h">
            <h2 id="vt-more-h" className="leaf">کارهای دیگر ویترین</h2>
            <ul>
              {others.map((o) => (
                <li key={o.slug}>
                  <a href={(process.env.PREVIEW_BASE ? "../" : "") + o.slug + "/"}>
                    <Image src={o.shots[0].src} width={o.shots[0].w} height={o.shots[0].h} alt="" sizes="(min-width: 900px) 20vw, 45vw" />
                    <b>{o.name}</b><small>{kindOf(o)}</small>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="vt-foot">
        <a href="../../">لئون گلد · طلا و جواهرات ۱۸ عیار · {SHOP.city}</a>
      </footer>
    </>
  );
}
