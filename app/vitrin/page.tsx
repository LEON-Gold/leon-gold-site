// vitrin/ on its own (someone trims a piece's address): the showcase lives on the home page, so send them there
import type { Metadata } from "next";
import "./vitrin.css";

export const metadata: Metadata = { title: "ویترین · لئون گلد", robots: { index: false, follow: true } };

export default function VitrinIndex() {
  return (
    <main className="vt vt-go">
      <meta httpEquiv="refresh" content="0;url=../#products" />
      <p>ویترین در صفحه‌ی اصلی است.</p>
      <a className="btn btn-gold" href="../#products">رفتن به ویترین</a>
    </main>
  );
}
