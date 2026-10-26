import Image from "next/image";
import PriceBoard from "@/components/PriceBoard";
import OrderForm from "@/components/OrderForm";
import Motion from "@/components/Motion";
import { COLLECTION, EXHIBITS, HERO, MELT, SHOP, STEPS, WORKBOX } from "@/lib/content";

export default function Home() {
  return (
    <main>
      <Motion />

      <header className="hero">
        <nav className="hero-nav" aria-label="بخش‌های سایت">
          <a className="link" href="#price">قیمت امروز</a>
          <a className="link" href="#collection">مجموعه</a>
          <a className="link" href="#wholesale">همکاران عمده</a>
          <a className="link" href="#order">سفارش</a>
        </nav>
        <div className="hero-pic">
          <Image src={HERO.src} width={HERO.w} height={HERO.h} alt={HERO.alt} priority sizes="100vw" />
        </div>
        <div className="hero-band">
          <h1 className="hero-name">لئون گلد</h1>
          <div className="hero-row">
            <p>طلا و جواهرات ۱۸ عیار در تهران، از {SHOP.since}؛ برای مشتری و برای همکار.</p>
            <a className="btn" href="#order">ثبت سفارش</a>
          </div>
        </div>
      </header>

      <section id="price" className="price" aria-labelledby="price-h">
        <div className="price-head" data-rise>
          <h2 id="price-h">قیمت امروز</h2>
          <p>نرخ تابلوی اتحادیه‌ی طلا و جواهر تهران، هر دو دقیقه تازه می‌شود. وزن و اجرت هر کار را بنویس تا قیمتش را ببینی.</p>
        </div>
        <PriceBoard />
      </section>

      <section className="exhibits" aria-labelledby="ex-h">
        <div className="ex-stage">
          <div className="ex-intro" data-rise>
            <h2 id="ex-h">شیر، در طلای ایران</h2>
            <p>لئون یعنی شیر. زرگرهای این سرزمین دو هزار و پانصد سال است شیر را در طلا می‌سازند؛ این‌ها چند تا از کارهایشان است که امروز در موزه‌ها مانده.</p>
          </div>
          <ol className="ex-track" data-rise>
            {EXHIBITS.map((x) => (
              <li className="ex-card" key={x.src}>
                <div className="ex-pic"><Image src={x.src} width={x.w} height={x.h} alt={x.name + "، " + x.place} sizes="(min-width: 900px) 30vw, 100vw" /></div>
                <div className="ex-text">
                  <h3>{x.name}</h3>
                  <p>{x.note} <span>{x.place}</span></p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="collection" className="collection" aria-labelledby="col-h">
        <h2 id="col-h" data-rise>مجموعه</h2>
        <ul className="lineup">
          {COLLECTION.map((c) => (
            <li key={c.name} data-rise>
              <span>{c.name}</span><span>{c.kind}</span><span className="num">{c.weight}</span><span>{c.ajrat}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="steps" aria-label="خرید از لئون گلد، از دیدن تا تحویل">
        {STEPS.map((s) => (
          <div className="step" key={s.verb} data-rise>
            <h2>{s.verb}</h2>
            <p>{s.line}</p>
          </div>
        ))}
      </section>

      <section className="about" aria-labelledby="about-h">
        <div className="about-panel">
          <h2 id="about-h" data-rise>از {SHOP.since}، در تهران</h2>
          <div className="about-text" data-rise>
            <div>
              <h3>برای مشتری</h3>
              <p>هر کار وزن و عیار خودش را دارد و با نرخ همان ساعت اتحادیه قیمت می‌شود. فاکتور، وزن دقیق و عیار ۷۵۰ را کنار هم تحویل می‌دهیم.</p>
            </div>
            <div>
              <h3>برای همکار</h3>
              <p>فروش عمده به گرم و به عیار ۷۵۰، با حساب گرمی و ریالی جدا؛ هر همکار صورت‌حساب و مانده‌ی خودش را دارد.</p>
            </div>
            <a className="btn" href="#order">ثبت سفارش</a>
          </div>
          <div className="about-pic"><Image src={WORKBOX.src} width={WORKBOX.w} height={WORKBOX.h} alt={WORKBOX.alt} sizes="(min-width: 900px) 38vw, 86vw" /></div>
        </div>
      </section>

      <section id="wholesale" className="wholesale" aria-labelledby="ws-h">
        <figure className="ws-pic">
          <video autoPlay muted loop playsInline preload="metadata" poster={MELT.poster} width={1280} height={720} aria-hidden="true">
            <source src={MELT.src} type="video/webm" />
          </video>
          <figcaption>طلای مذاب هنگام سرد شدن بلوری می‌شود.</figcaption>
        </figure>
        <div className="ws-text" data-rise>
          <h2 id="ws-h">همکار عمده‌اید؟</h2>
          <p>خرید و فروش به گرم ۷۵۰، آبشده و ساخته. برای دیدن فهرست کارهای عمده و اجرت همکاری پیام بدهید.</p>
          <a className="btn" href={SHOP.whatsapp}>پیام در واتس‌اپ</a>
        </div>
      </section>

      <section id="order" className="order-sec" aria-labelledby="order-h">
        <div className="order-head" data-rise>
          <h2 id="order-h">ثبت سفارش</h2>
          <p>بگو چه کاری می‌خواهی؛ در ساعت کاری تماس می‌گیریم.</p>
        </div>
        <OrderForm />
        <a className="order-phone num" href={SHOP.phoneHref} dir="ltr">{SHOP.phone}</a>
      </section>

      <footer className="foot">
        <div className="foot-cols">
          <div><b>نشانی</b><span>{SHOP.address}</span><span>{SHOP.hours}</span></div>
          <div><b>بخش‌ها</b><a className="link" href="#price">قیمت امروز</a><a className="link" href="#collection">مجموعه</a><a className="link" href="#order">سفارش</a></div>
          <div><b>شبکه‌ها</b><a className="link" href={SHOP.instagram}>اینستاگرام</a><a className="link" href={SHOP.whatsapp}>واتس‌اپ</a></div>
          <div><b>همکاران</b><a className="link" href="/daftar">دفتر لئون</a><a className="link" href="/panel">پنل مدیریت</a></div>
        </div>
        <p className="foot-name" aria-hidden>لئون گلد</p>
        <p className="foot-legal">
          عکس‌های قدیمی از مجموعه‌های آزاد موزه‌ها:{" "}
          {[HERO, ...EXHIBITS, WORKBOX, MELT].map((x, i) => (
            <span key={x.src}>{i ? "، " : ""}<a className="link" href={x.page} dir="ltr">{x.credit}</a></span>
          ))}
          .
        </p>
      </footer>
    </main>
  );
}
