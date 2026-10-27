import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { GL_VARS } from "@/lib/guilloche";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "لئون گلد · طلا و جواهرات ۱۸ عیار",
  description: "طلا و جواهرات ۱۸ عیار لئون گلد در تهران. قیمت زنده‌ی اتحادیه، ماشین‌حساب قیمت، ثبت سفارش و فروش عمده به همکاران.",
  icons: { icon: "leaf.png", apple: "leaf.png" },
  // the share card for WhatsApp and Telegram links; SITE_URL is the real domain once it exists
  metadataBase: new URL(process.env.SITE_URL || "https://leon-gold.github.io/leon-gold-app/site/"),
  openGraph: { title: "لئون گلد", description: "طلا و جواهرات ۱۸ عیار در تهران. قیمت زنده‌ی اتحادیه و ثبت سفارش.", images: [{ url: "og.jpg", width: 1200, height: 630 }], locale: "fa_IR", type: "website" },
  twitter: { card: "summary_large_image", images: ["og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#06140e", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl">
      <body style={GL_VARS as CSSProperties}>{children}</body>
    </html>
  );
}
