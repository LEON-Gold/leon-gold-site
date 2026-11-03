import type { Metadata } from "next";
import Hesab from "@/components/hesab/Hesab";
import "./hesab.css";

export const metadata: Metadata = {
  title: "حساب من · لئون گلد",
  description: "مانده‌ی حساب طلایی و ریالی، صورتحساب و سفارش‌های مشتریان و تأمین‌کنندگان لئون گلد.",
  robots: { index: false, follow: false },
  // added to the home screen it opens as its own app, which is what lets an iPhone show its notifications
  appleWebApp: { capable: true, title: "حساب من", statusBarStyle: "black-translucent" },
};

export default function Page() {
  return <Hesab />;
}
