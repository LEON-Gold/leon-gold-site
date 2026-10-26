// Page content. Items marked SAMPLE are placeholders until the owner sends the real details.

export const SHOP = {
  name: "لئون گلد",
  since: "۱۳۶۷",
  city: "تهران",
  phone: "۰۲۱ ۰۰۰۰ ۰۰۰۰", // SAMPLE
  phoneHref: "tel:+982100000000", // SAMPLE
  whatsapp: "https://wa.me/989000000000", // SAMPLE
  instagram: "https://instagram.com/", // SAMPLE
  address: "تهران، بازار طلا", // SAMPLE
  hours: "شنبه تا پنجشنبه، ۱۰ تا ۱۹", // SAMPLE
};

// The lion in gold: museum pieces shown as the craft's history, never as Leon Gold's own work.
export type Exhibit = { src: string; w: number; h: number; name: string; note: string; place: string; credit: string; page: string };
export const EXHIBITS: Exhibit[] = [
  { src: "/museum/dark/plaque-with-horned-lion-griffins.jpg", w: 1387, h: 1787, name: "شیردال‌های شاخ‌دار", note: "پلاک طلا با دو شیرِ بالدار، سده‌ی ششم تا چهارم پیش از میلاد.", place: "موزه‌ی متروپولیتن",
    credit: "The Met, Open Access (CC0)", page: "https://www.metmuseum.org/art/collection/search/324290" },
  { src: "/museum/dark/ars-summum-tesoro-oxus-brazalete.jpg", w: 1147, h: 1248, name: "دستبند گنجینه‌ی جیحون", note: "دستبند طلای هخامنشی با دو سرِ جانورِ افسانه‌ای رو در رو.", place: "گنجینه‌ی جیحون",
    credit: "Manuel de Corselas, public domain, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:Ars_Summum_Tesoro_Oxus_brazalete.JPG" },
  { src: "/museum/dark/lion-head-armlet-terminals-iran-achaemenid-period.jpg", w: 879, h: 1670, name: "سرِ شیر بر بازوبند", note: "دو سرِ شیر که دو سرِ یک بازوبند طلا را می‌بستند؛ ایران، دوره‌ی هخامنشی.", place: "موزه‌ی هنر سینسیناتی",
    credit: "Daderot, CC0, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:Lion-head_armlet_terminals,_Iran,_Achaemenid_period,_5th_or_4th_century_BC,_gold_-_Cincinnati_Art_Museum_-_DSC03945.JPG" },
  { src: "/museum/dark/seljuk-islamic-gold-earrings-28702857995.jpg", w: 1198, h: 588, name: "گوشواره‌های سلجوقی", note: "جفت گوشواره‌ی طلا با دانه‌های ریز، هزار سال پیش.", place: "موزه‌ی پرگامون، برلین",
    credit: "Gary Todd, CC0, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:Seljuk_Islamic_Gold_Earrings_(28702857995).jpg" },
  { src: "/museum/dark/5-pahlavi-iranian-golden-coin.jpg", w: 1869, h: 1067, name: "پنج پهلوی، ۱۳۰۵", note: "سکه‌ی طلا با نشان شیر و خورشید؛ همان شیری که هنوز روی طلای ایران است.", place: "بانک ملی ایران",
    credit: "Bank Melli Iran, public domain, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:5_Pahlavi_-_Iranian_Golden_coin.jpg" },
];

export const HERO = { src: "/museum/dark/gold-lion-head-pendant.jpg", w: 1714, h: 2188, alt: "آویز طلا به شکل سرِ شیر، قبرس، سده‌ی پنجم پیش از میلاد",
  credit: "The Met, Open Access (CC0)", page: "https://www.metmuseum.org/art/collection/search/242762" };

export const WORKBOX = { src: "/museum/goldsmith-s-workbox-mao-685-30.jpg", w: 1920, h: 1440, alt: "جعبه‌ی ابزار زرگر با ترازو و سنگ‌های وزن، ایران، ۱۷۰۹ میلادی",
  credit: "Rmashhadi, public domain, Wikimedia Commons (Louvre MAO 685)", page: "https://commons.wikimedia.org/wiki/File:Goldsmith%27s_workbox,_MAO_685_(30).jpg" };

export const MELT = { src: "/museum/the-crystallization-phenomenon-when-liquid-gold-solidifies.webm", poster: "/museum/the-crystallization-phenomenon-when-liquid-gold-solidifies-poster.jpg",
  credit: "François Nguyen, CC BY 2.0, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:The_crystallization_phenomenon_when_liquid_gold_solidifies_is_full_of_dendrites..webm" };

// SAMPLE collection: categories and typical ranges, to be replaced from the CRM panel
export const COLLECTION = [
  { name: "انگشتر", kind: "زنانه و مردانه", weight: "۲ تا ۸ گرم", ajrat: "اجرت از ۷٪" },
  { name: "گردنبند و آویز", kind: "زنجیر، آویز، اسم", weight: "۳ تا ۱۵ گرم", ajrat: "اجرت از ۸٪" },
  { name: "دستبند", kind: "زنجیری و النگو", weight: "۴ تا ۲۰ گرم", ajrat: "اجرت از ۷٪" },
  { name: "گوشواره", kind: "میخی، حلقه، آویز", weight: "۱ تا ۶ گرم", ajrat: "اجرت از ۹٪" },
  { name: "سرویس", kind: "گردنبند، دستبند و گوشواره", weight: "۱۰ تا ۴۰ گرم", ajrat: "اجرت از ۸٪" },
  { name: "سکه و شمش", kind: "بهار آزادی، گرمی، شمش", weight: "از ۱ گرم", ajrat: "بدون اجرت ساخت" },
];

export const STEPS = [
  { verb: "ببین", line: "کار را در ویترین یا در فروشگاه ببین؛ وزن و عیارش روی برچسب نوشته شده." },
  { verb: "بپرس", line: "قیمت را با نرخ همین ساعتِ اتحادیه و اجرتِ همان کار حساب می‌کنیم." },
  { verb: "سفارش بده", line: "اسم و شماره‌ات را بگذار؛ در ساعت کاری تماس می‌گیریم و جزئیات را می‌گوییم." },
  { verb: "تحویل بگیر", line: "با فاکتور، وزن دقیق و عیار ۷۵۰، حضوری در فروشگاه." }, // SAMPLE: delivery options
];
