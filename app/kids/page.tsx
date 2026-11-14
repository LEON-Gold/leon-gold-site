import KidsDoor from "@/components/KidsDoor";
import Vitrin from "@/components/hesab/Vitrin";
import "../hesab/hesab.css";

// «لئون کیدز» (owner, 2026-11-14): the showcase's «بچگانه» group on a page of its own, with its own look.
export const metadata = {
  title: "لئون کیدز · لئون گلد",
  description: "کارهای بچگانه‌ی لئون گلد با وزن، عیار، اجرت و قیمت تقریبیِ همین ساعت.",
  alternates: { canonical: "./" },
};

export default function Page() {
  return (
    <KidsDoor fine="قیمت‌ها تقریبی است و با نرخ لحظه‌ی خرید قطعی می‌شود.">
      <Vitrin pub kids />
    </KidsDoor>
  );
}
