import Image from "next/image";
import Header from "@/components/Header";
import { PricePanel, Ticker } from "@/components/Price";
import OrderForm from "@/components/OrderForm";
import Motion from "@/components/Motion";
import { ROSETTE, ROSETTE_DRAW, medallion } from "@/lib/guilloche";
import Jewel from "@/components/Jewel";
import Hallmark from "@/components/Hallmark";
import Exhibits from "@/components/Exhibits";
import Products from "@/components/Products";
import { PRODUCTS } from "@/lib/products";
import { COLLECTION, EXHIBITS, HERO, LEDGER, MELT, SHOP, STEPS, WORKBOX } from "@/lib/content";

const Rosette = ({ className, draw }: { className: string; draw?: boolean }) => <div className={className} aria-hidden dangerouslySetInnerHTML={{ __html: draw ? ROSETTE_DRAW : ROSETTE }} />;
const fa = (n: number) => n.toLocaleString("fa-IR");
const DEPTH = [9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function Home() {
  return (
    <>
      <Header ledger={LEDGER} />
      <Motion />
      <main id="top">
        {/* the vault: rosettes turning behind the jewel, the name struck in gold leaf */}
        <section className="hero" aria-labelledby="hero-h">
          <Rosette className="hero-rose r1" draw />
          <div className="hero-light" aria-hidden />
          <Rosette className="hero-rose r2" />
          <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
          <div className="hero-in">
            {/* the jewel, struck with a little depth: stacked copies behind it read as gold thickness when it turns */}
            <div className="hero-jewel"><div className="jw">
              {DEPTH.map((z) => <img key={z} className="jw-back" src="/leaf.png" alt="" width={265} height={490} style={{ "--z": z } as React.CSSProperties} />)}
              <img className="jw-face" src="/leaf.png" alt="" width={265} height={490} />
            </div></div>
            <p className="hero-latin leaf leaf-sweep" lang="en" dir="ltr">LEON GOLD</p>
            <h1 id="hero-h" className="hero-name leaf leaf-sweep">لئون گلد</h1>
            <div className="hero-cta">
              <a className="btn btn-gold" href="#order">ثبت سفارش</a>
              <a className="btn btn-line" href="#price">قیمت امروز</a>
            </div>
          </div>
          <p className="hero-cue" aria-hidden>پایین بکشید<i>↓</i></p>
          <Hallmark className="hero-mark" />
          <Ticker />
        </section>

        <section id="price" className="sec-paper" aria-labelledby="price-h">
          <div className="sec-head" data-rise>
            <h2 id="price-h"><i aria-hidden>◆</i>قیمت امروز</h2>
            <p>نرخ تابلوی اتحادیه‌ی طلا و جواهر تهران، زنده. وزن و اجرت هر کار را بنویس تا قیمتش را همین حالا ببینی.</p>
          </div>
          <PricePanel />
        </section>

        <section id="collection" className="sec-paper sec-collection" aria-labelledby="col-h">
          <div className="sec-head" data-rise>
            <h2 id="col-h"><i aria-hidden>◆</i>مجموعه</h2>
            <p>هر کار با وزن و عیار ۷۵۰ روی برچسبش، و قیمت با نرخ همان ساعت اتحادیه.</p>
          </div>
          <ul className="cards" data-rise>
            {COLLECTION.map((c, i) => (
              <li className="card" key={c.name}>
                <div className="card-art">
                  <div className="card-med" aria-hidden dangerouslySetInnerHTML={{ __html: medallion(i) }} />
                  <Jewel kind={c.art} id={String(i)} />
                </div>
                <h3>{c.name}</h3>
                <p>{c.kind}</p>
                <dl className="num">
                  <div><dt>وزن</dt><dd>{c.weight}</dd></div>
                  <div><dt>اجرت</dt><dd>{c.ajrat.replace("اجرت ", "")}</dd></div>
                </dl>
                <a className="card-go" href="#order">سفارش {c.name}</a>
              </li>
            ))}
          </ul>
        </section>

        {PRODUCTS.length > 0 && (
          <section id="products" className="sec-paper" aria-labelledby="pr-h">
            <div className="sec-head" data-rise>
              <h2 id="pr-h"><i aria-hidden>◆</i>ویترین</h2>
              <p>کارهای همین روزهای لئون گلد، با وزن برچسب و قیمت تقریبی با نرخ همین ساعت اتحادیه.</p>
            </div>
            <Products items={PRODUCTS} />
          </section>
        )}

        <section id="heritage" className="sec-vault heritage" aria-labelledby="her-h">
          <Rosette className="her-rose" />
          <div className="sec-head on-dark" data-rise>
            <h2 id="her-h" className="leaf">شیر، در طلای ایران</h2>
            <p>لئون یعنی شیر. زرگرهای این سرزمین بیست و پنج قرن است شیر را در طلا می‌سازند؛ این‌ها چند تا از کارهایشان است که امروز در موزه‌ها مانده.</p>
          </div>
          <Exhibits items={EXHIBITS} />
          <div className="her-more" data-rise>
            <p>طلا از کجا می‌آید، عیار چطور شمرده می‌شود و زرگرهای ایران سه هزار سال با آن چه کرده‌اند.</p>
            <a className="btn btn-line" href="museum/">ورود به موزه‌ی طلا</a>
          </div>
        </section>

        <section className="sec-paper steps" aria-labelledby="steps-h">
          <div className="sec-head" data-rise>
            <h2 id="steps-h"><i aria-hidden>◆</i>از دیدن تا تحویل</h2>
            <p>خرید از لئون گلد چهار قدم است.</p>
          </div>
          <ol className="step-row" data-rise>
            {STEPS.map((s, i) => (
              <li key={s.verb}>
                <span className="step-n num" aria-hidden>{fa(i + 1)}</span>
                <h3>{s.verb}</h3>
                <p>{s.line}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sec-vault legacy" aria-labelledby="leg-h">
          <div className="legacy-pic" data-rise>
            <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
            <Image src={WORKBOX.src} width={WORKBOX.w} height={WORKBOX.h} alt={WORKBOX.alt} sizes="(min-width: 900px) 40vw, 90vw" />
          </div>
          <div className="legacy-text" data-rise>
            <h2 id="leg-h" className="leaf">لئون گلد، در تهران</h2>
            <Hallmark className="legacy-mark" />
            <div className="legacy-stats">
              <div><b className="num">۷۵۰</b><span>عیار هر کار</span></div>
              <div><b className="num">۲</b><span>حساب گرمی و ریالی</span></div>
            </div>
            <h3>برای مشتری</h3>
            <p>هر کار وزن و عیار خودش را دارد و با نرخ همان ساعت اتحادیه قیمت می‌شود. فاکتور، وزن دقیق و عیار ۷۵۰ کنار هم تحویل داده می‌شوند.</p>
            <h3>برای همکار</h3>
            <p>فروش عمده به گرم و عیار ۷۵۰، با حساب گرمی و ریالی جدا؛ هر همکار صورت‌حساب و مانده‌ی خودش را دارد.</p>
          </div>
        </section>

        <section id="wholesale" className="sec-paper wholesale" aria-labelledby="ws-h">
          <figure className="ws-media" data-rise>
            <video muted loop playsInline preload="none" data-lazy poster={MELT.poster} width={1280} height={720} aria-hidden="true">
              <source src={MELT.src} type="video/webm" />
            </video>
            <figcaption>طلای مذاب هنگام سرد شدن بلوری می‌شود.</figcaption>
          </figure>
          <div className="ws-text" data-rise>
            <h2 id="ws-h"><i aria-hidden>◆</i>همکار عمده‌اید؟</h2>
            <p>خرید و فروش به گرم ۷۵۰، آبشده و ساخته. برای فهرست کارهای عمده و اجرت همکاری پیام بدهید؛ حساب هر همکار در دفتر لئون جدا نگه داشته می‌شود.</p>
            <div className="ws-cta">
              <a className="btn btn-ink" href={SHOP.whatsapp}>پیام در واتس‌اپ</a>
              <a className="btn-text" href={SHOP.phoneHref}>یا تماس: <span className="num" dir="ltr">{SHOP.phone}</span></a>
            </div>
          </div>
        </section>

        <section id="order" className="sec-vault order" aria-labelledby="order-h">
          <Rosette className="order-rose" />
          <div className="order-card paper" data-rise>
            <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
            <h2 id="order-h"><i aria-hidden>◆</i>ثبت سفارش</h2>
            <p className="order-sub">بگو چه کاری می‌خواهی؛ در ساعت کاری تماس می‌گیریم.</p>
            <OrderForm />
          </div>
          <div className="order-info" data-rise>
            <div><small>تلفن</small><a className="num" href={SHOP.phoneHref} dir="ltr">{SHOP.phone}</a></div>
            <div><small>شهر</small><span>{SHOP.city}</span></div>
            <div><small>ساعت کاری</small><span>{SHOP.hours}</span></div>
            <div><small>شبکه‌ها</small><span><a href={SHOP.instagram} dir="ltr">@{SHOP.instagramId}</a> · <a href={SHOP.whatsapp}>واتس‌اپ</a></span></div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <Rosette className="foot-rose" />
        <img className="foot-jewel" src="/leaf.png" alt="" width={265} height={490} />
        <p className="foot-latin leaf" lang="en" dir="ltr">LEON GOLD</p>
        <p className="foot-fa">طلا و جواهرات · تهران</p>
        <nav className="foot-links" aria-label="پیوندها">
          <a href="#price">قیمت امروز</a><a href="#collection">مجموعه</a><a href="#wholesale">همکاران</a><a href="#order">تماس</a>
          <a href={LEDGER}>دفتر لئون</a>
        </nav>
        <p className="foot-credit">
          آثار تاریخی از مجموعه‌های آزاد موزه‌ها:{" "}
          {[HERO, ...EXHIBITS, WORKBOX, MELT].map((x, i) => (
            <span key={x.src}>{i ? " · " : ""}<a href={x.page} dir="ltr">{x.credit}</a></span>
          ))}
        </p>
      </footer>
    </>
  );
}
