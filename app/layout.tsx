import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { GL_VARS } from "@/lib/guilloche";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "لئون گلد · طلا و جواهرات ۱۸ عیار",
  description: "طلا و جواهرات ۱۸ عیار لئون گلد در تهران، از ۱۳۶۷. قیمت زنده‌ی اتحادیه، ماشین‌حساب قیمت، ثبت سفارش و فروش عمده به همکاران.",
  icons: { icon: "leaf.png", apple: "leaf.png" },
};

export const viewport: Viewport = { themeColor: "#06140e", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl">
      <body style={GL_VARS as CSSProperties}>{children}</body>
    </html>
  );
}
