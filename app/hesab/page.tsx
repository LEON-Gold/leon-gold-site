import type { Metadata } from "next";
import Hesab from "@/components/hesab/Hesab";
import "./hesab.css";

export const metadata: Metadata = {
  title: "حساب من · لئون گلد",
  description: "مانده‌ی حساب طلایی و ریالی، صورتحساب و سفارش‌های مشتریان و تأمین‌کنندگان لئون گلد.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Hesab />;
}
