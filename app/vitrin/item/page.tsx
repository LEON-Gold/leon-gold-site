import Door from "@/components/Door";
import { ProductPage } from "@/components/hesab/Vitrin";
import "../../hesab/hesab.css";

// one piece of the showcase on a page of its own (owner, 2026-11-28): vitrin/item/?id=…
export const metadata = {
  title: "ویترین · لئون گلد",
  description: "یک کار از ویترین لئون گلد با عکس‌ها، وزن، عیار، اجرت و قیمت تقریبیِ همین ساعت.",
  robots: { index: false },
};

export default function Page() {
  return (
    <Door shop wide name="ویترین" latin="LEON GOLD · SHOWCASE" home="../../" back="../" backLabel="ویترین" fine="قیمت‌ها تقریبی است و با نرخ لحظه‌ی خرید قطعی می‌شود.">
      <ProductPage />
    </Door>
  );
}
