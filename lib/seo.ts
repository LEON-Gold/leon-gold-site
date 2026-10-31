// Structured data for search engines (schema.org JSON-LD). Only what is true: the city, never a street address or a founding year (the owner's choice).
import { SHOP } from "@/lib/content";

const SITE = (process.env.SITE_URL || "https://leon-gold.github.io/leon-gold-app/site/").replace(/\/?$/, "/");

export const STORE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": SITE + "#site", url: SITE, name: SHOP.name, alternateName: "Leon Gold", inLanguage: "fa-IR" },
    {
      "@type": "JewelryStore", "@id": SITE + "#store", url: SITE, name: SHOP.name, alternateName: "Leon Gold",
      description: "طلا و جواهرات ۱۸ عیار در تهران؛ انگشتر، گردنبند، دستبند و گوشواره‌ی طلا با قیمت روز اتحادیه، و فروش عمده به همکاران.",
      image: SITE + "og.jpg", logo: SITE + "leaf.png",
      telephone: SHOP.phoneHref.replace("tel:", ""), sameAs: [SHOP.instagram, SHOP.telegram],
      address: { "@type": "PostalAddress", addressLocality: SHOP.city, addressCountry: "IR" },
      areaServed: { "@type": "City", name: SHOP.city },
      currenciesAccepted: "IRR",
      openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"], opens: "11:00", closes: "18:00" }],
      knowsLanguage: "fa",
    },
  ],
};
