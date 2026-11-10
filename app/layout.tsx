import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { GL_VARS } from "@/lib/guilloche";
import { THEME_BOOT } from "@/components/ThemeToggle";
import { LOADER_CSS } from "@/lib/loader";
import { MORPH_CSS } from "@/lib/morph";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "لئون گلد · خرید طلا و جواهرات ۱۸ عیار در تهران",
  description: "خرید طلا و جواهرات ۱۸ عیار از لئون گلد در تهران: انگشتر، گردنبند، دستبند و گوشواره‌ی طلا با قیمت زنده‌ی اتحادیه، محاسبه‌ی قیمت طلا با اجرت، سفارش در تلگرام و فروش عمده به همکاران.",
  icons: { icon: "/leaf.png", apple: "/leaf.png" },
  // the share card for WhatsApp and Telegram links; SITE_URL is the real domain once it exists
  metadataBase: new URL(process.env.SITE_URL || "https://leon-gold.github.io/leon-gold-app/site/"),
  openGraph: { siteName: "لئون گلد", title: "لئون گلد · طلا و جواهرات ۱۸ عیار در تهران", description: "طلا و جواهرات ۱۸ عیار در تهران. قیمت زنده‌ی اتحادیه و ثبت سفارش.", images: [{ url: "og.jpg", width: 1200, height: 630 }], locale: "fa_IR", type: "website" },
  twitter: { card: "summary_large_image", images: ["og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#07130e", width: "device-width", initialScale: 1, viewportFit: "cover" };

// between the site's pages (owner, 2026-11-10): the card or button you tap becomes the next page's title (globals.css
// names it «lg-title» for the browser's view transition); the page's own title steps aside while that happens
const VT_TAP = `document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target||e.metaKey||e.ctrlKey||a.origin!==location.origin)return;var c=a.closest(".vc-card,.card,.hs-vcard,.btn,.bar-ledger,.sheet-pill")||a;document.documentElement.classList.add("vt-tap");c.style.viewTransitionName="lg-title"},true);addEventListener("pageshow",function(){document.documentElement.classList.remove("vt-tap");document.querySelectorAll("[style*=lg-title]").forEach(function(x){x.style.viewTransitionName=""})});`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /><style dangerouslySetInnerHTML={{ __html: LOADER_CSS + MORPH_CSS }} /><script dangerouslySetInnerHTML={{ __html: VT_TAP }} /></head>
      <body style={GL_VARS as CSSProperties}>{children}</body>
    </html>
  );
}
