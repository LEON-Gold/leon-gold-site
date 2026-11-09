import Door from "@/components/Door";
import Vitrin from "@/components/hesab/Vitrin";
import "../hesab/hesab.css";

// The site's own showcase (owner, 2026-11-09): pieces the owner marks «روی سایت» in the ledger, for buyers from outside
// (not the trade), at the wage set for the site. Each piece's order button leads to «حساب من» to sign in or sign up.
export const metadata = {
  title: "ویترین · لئون گلد",
  description: "کارهای موجود لئون گلد با وزن، عیار، اجرت و قیمت تقریبیِ همین ساعت.",
  alternates: { canonical: "./" },
};

export default function Page() {
  return (
    <Door name="ویترین" latin="LEON GOLD · SHOWCASE" fine="قیمت‌ها تقریبی است و با نرخ لحظه‌ی خرید قطعی می‌شود.">
      <Vitrin pub />
    </Door>
  );
}
