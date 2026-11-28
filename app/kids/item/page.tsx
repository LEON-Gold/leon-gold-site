import KidsDoor from "@/components/KidsDoor";
import { ProductPage } from "@/components/hesab/Vitrin";
import "../../hesab/hesab.css";

// one piece of «لئون کیدز» on a page of its own (owner, 2026-11-28): kids/item/?id=…
export const metadata = {
  title: "لئون کیدز · لئون گلد",
  description: "یک کار از لئون کیدز با عکس‌ها، وزن، عیار، اجرت و قیمت تقریبیِ همین ساعت.",
  robots: { index: false },
};

export default function Page() {
  return (
    <KidsDoor shop base="../../" fine="قیمت‌ها تقریبی است و با نرخ لحظه‌ی خرید قطعی می‌شود.">
      <ProductPage kids />
    </KidsDoor>
  );
}
