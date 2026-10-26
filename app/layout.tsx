import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "لئون گلد · طلا و جواهرات ۱۸ عیار",
  description: "طلا و جواهرات ۱۸ عیار لئون گلد در تهران، از ۱۳۶۷. قیمت امروز طلا از اتحادیه، ثبت سفارش و فروش عمده به همکاران.",
  icons: { icon: "/leaf.png", apple: "/leaf.png" },
};

export const viewport: Viewport = { themeColor: "#06140e", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
