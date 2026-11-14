import type { Metadata } from "next";
import "./help.css";

// A one-page Persian checklist for the owner's first real sign-in, kept off search engines like /panel and /hesab.
export const metadata: Metadata = {
  title: "راهنمای اولین ورود · لئون گلد",
  robots: { index: false, follow: false },
};

export default function HelpPage() {
  return (
    <div className="hp">
      <header className="bar solid door-bar">
        <a className="bar-brand" href="../"><img src="/leaf.webp" alt="" width={18} height={34} /><span className="leaf">لئون گلد</span></a>
        <span className="door-bar-t">راهنما</span>
        <a className="btn btn-line door-back" href="../">بازگشت به پنل</a>
      </header>
      <main className="hp-in">
        <section className="paper hp-card">
          <i className="corner c1" aria-hidden /><i className="corner c2" aria-hidden /><i className="corner c3" aria-hidden /><i className="corner c4" aria-hidden />
          <h1 className="hp-title">راهنمای اولین ورود</h1>
          <p className="hp-sub">این صفحه فقط برای توست؛ در جست‌وجو دیده نمی‌شود. برای اولین بار که وارد پنل مدیریت می‌شوی، همین‌جا را دنبال کن.</p>

          <h2>۱) اولین ورود به پنل مدیریت</h2>
          <ol className="hp-steps">
            <li>آدرس پنل را در سافاری باز کن.</li>
            <li>یک کارت کاغذی با دو کادر «نام کاربری» و «رمز» می‌بینی.</li>
            <li>همان نام کاربری و رمزی را بزن که با آن «دفتر لئون» را روی گوشی همگام کرده‌ای؛ چیز تازه‌ای لازم نیست.</li>
            <li>دکمه‌ی طلایی «ورود» را بزن.</li>
            <li>باید ببینی: نوار بالا با چهار برگه «امروز، مشتریان، سفارش‌ها، اعداد». چند ثانیه طول می‌کشد تا دفتر از سرور بیاید؛ تا آن‌وقت می‌نویسد «در حال آوردن دفتر…».</li>
          </ol>
          <h3>اگر این پیام‌ها را دیدی</h3>
          <ul className="hp-faq">
            <li><b>«نام کاربری یا رمز درست نیست»</b> — دوباره همان را که در «دفتر لئون» می‌زنی تایپ کن؛ حروف بزرگ و کوچک لاتین مهم است.</li>
            <li><b>«چند بار اشتباه شد؛ ربع ساعت دیگر دوباره امتحان کن»</b> — صبر کن، بعد دوباره.</li>
            <li><b>«به سرور وصل نشد»</b> — وای‌فای یا دیتای گوشی را چک کن و دوباره «ورود» را بزن.</li>
            <li>اگر وارد شدی ولی دفتر نیامد، آیکون چرخشی بالای صفحه (کنار خروج) را بزن تا دوباره بکشد.</li>
          </ul>

          <h2>۲) لینک ورود «حساب من» برای مشتری‌ها</h2>
          <ul className="hp-faq">
            <li>لینک ورود، خروج یک مشتری از همه‌ی دستگاه‌ها، و بستن رسیدهای کارت‌به‌کارت فقط در خودِ «دفتر لئون» است، در بخش «کاربران» که فقط مدیر می‌بیند.</li>
            <li>هر لینک فقط یک بار کار می‌کند و تا ۷ روز اعتبار دارد؛ لینک تازه، لینک قبلیِ همان شخص را باطل می‌کند.</li>
            <li>رسیدهای در انتظار را بالای «امروز» در همین پنل هم می‌بینی، فقط برای دیدن.</li>
          </ul>

          <h2>نکته</h2>
          <ul className="hp-faq">
            <li>رمز پنل را برای کسی، حتی مشتری، نفرست. فقط لینک‌های «حساب من» برای مشتری‌ها ساخته می‌شوند و فقط برای همان مشتری‌اند.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
