import Door from "@/components/Door";

// The site's own «not found» (owner, 2026-11-10). A static export writes it as 404.html; scripts/preview.sh also puts a
// copy at the root of the app repo, which GitHub Pages serves for any address it does not have, at any depth: so every
// link here is absolute (the preview's base path, or the real domain's root).
const B = process.env.PREVIEW_BASE || "";

export const metadata = { title: "این صفحه پیدا نشد · لئون گلد", robots: { index: false } };

export default function NotFound() {
  return (
    <Door name="۴۰۴" latin="LEON GOLD · NOT IN THE VAULT" home={B + "/"} fine="اگر فکر می‌کنید این صفحه باید باشد، در تلگرام به لئون گلد خبر بدهید.">
      <div className="nf">
        {/* the vault's combination dial, turning left and right in search of the page */}
        <div className="nf-dial" aria-hidden>
          <svg viewBox="0 0 120 120">
            <circle className="nf-o" cx="60" cy="60" r="56" />
            <g className="nf-turn">
              <circle className="nf-i" cx="60" cy="60" r="44" />
              {Array.from({ length: 40 }, (_, i) => <line key={i} className={i % 5 ? "nf-t" : "nf-t big"} x1="60" y1={i % 5 ? 20 : 17} x2="60" y2="24" transform={`rotate(${i * 9} 60 60)`} />)}
              <circle className="nf-h" cx="60" cy="60" r="14" />
            </g>
            <path className="nf-mark" d="M60 2 l5 9 h-10z" />
          </svg>
          <span className="nf-q">؟</span>
        </div>
        <h2 className="nf-h">این صفحه در گاوصندوق لئون پیدا نشد</h2>
        <p className="nf-p">شاید نشانی را اشتباه نوشته‌اید یا این صفحه جابه‌جا شده. از یکی از این راه‌ها ادامه بدهید:</p>
        <nav className="nf-go" aria-label="راه‌های ادامه">
          <a className="btn btn-gold" href={B + "/"}>صفحه‌ی اصلی</a>
          <a className="btn btn-line" href={B + "/vitrin/"}>ویترین</a>
          <a className="btn btn-line" href={B + "/hesab/"}>حساب من</a>
          <a className="btn btn-line" href={B + "/museum/"}>موزه‌ی طلا</a>
        </nav>
      </div>
    </Door>
  );
}
