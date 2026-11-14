import type { Metadata } from "next";
import Hesab from "@/components/hesab/Hesab";
import "./hesab.css";

export const metadata: Metadata = {
  title: "حساب من · لئون گلد",
  description: "مانده‌ی حساب طلایی و ریالی، صورت‌حساب و سفارش‌های مشتریان و تأمین‌کنندگان لئون گلد.",
  robots: { index: false, follow: false },
  // added to the home screen it opens as its own app, which is what lets an iPhone show its notifications
  appleWebApp: { capable: true, title: "حساب من", statusBarStyle: "black-translucent" },
  // a square icon on the emerald ground: the iPhone uses it for the home screen and for every notification
  // (the site's own leaf.png is tall and see-through, so the phone squeezed it onto black)
  icons: { icon: "/hesab/icon-180.png", apple: "/hesab/icon-180.png" },
};

export default function Page() {
  return <Hesab />;
}
