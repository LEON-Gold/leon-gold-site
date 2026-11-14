// Page content. The shop has no landline: the owner's mobile is the phone; messages go to Telegram (owner, 2026-10-31). No street address or founding year on the site, by the owner's choice.

export const SHOP = {
  name: "لئون گلد",
  city: "تهران",
  phone: "۰۹۱۲ ۹۳۷ ۴۵۵۲",
  phoneHref: "tel:+989129374552",
  telegram: "https://t.me/alieshghinejad",
  telegramId: "alieshghinejad",
  instagram: "https://instagram.com/___leongold___",
  instagramId: "___leongold___",
  hours: "شنبه تا چهارشنبه، ۱۱ تا ۱۸",
  // the owner's accounts for a card-to-card payment or a transfer, shown in «حساب من» only to a customer who owes (owner, 2026-11-01)
  cards: [
    { bank: "ملت", name: "علی عشقی نژاد", card: "6104338696210802", sheba: "IR810120020000009060005609" },
    { bank: "سامان", name: "علی عشقی نژاد", card: "6219861947368451", sheba: "IR830560611828005530372901" },
  ],
};

// «آیین‌نامه‌ی خرید و فروش» in «حساب من». The first clauses are the ones printed under every ledger invoice (owner,
// 2026-11-01); the owner will add the rest of the trade's rules and conditions here.
export const RULES: { title: string; items?: string[]; text?: string }[] = [
  { title: "شرایط فاکتورها", items: [
    "۰/۵ تا ۱ درصد ضرر به ازای هر هفته دیرکرد در فاکتور اعمال می‌گردد، مگر در شرایط استثناء.",
    "اشتباه از طرفین قابل برگشت است.",
    "مرجوعی حداکثر تا یک‌ماه دریافت می‌گردد، در غیر این‌صورت شامل ۳٪ ضرر می‌باشد، مگر تعویض صورت گیرد.",
    "در صورت فروش نرفتن اجناس، ما خود را موظف به تعویض با دیگر اجناس می‌دانیم.",
  ] },
  { title: "کالای امانی (همکاران)", text: "کلیه مندرجات قبض جهت بازاریابی به رسم امانت تحویل می‌گردد. تحویل‌گیرنده شرعاً و قانوناً متعهد و ملزم است هر آنچه از اقلام اجناس را بابت خود یا دیگری فاکتور نماید، بجای آن را علاوه بر اجرت، نقد به «لئون گلد» بپردازد و مابقی اجناس را عندالمطالبه مسترد نماید؛ چون اجناس مذبور نزد او امانت بوده و دین است بر ذمه‌ی او. در این خصوص هرگونه کوتاهی و بی‌احتیاطی که به عمل آید، تحویل‌گیرنده ضامن و پاسخگو و حتی ملزم به پرداخت با دیگر اموال خویش در صورت ضرر می‌باشد." },
];

// value-added tax: 3% of the whole price (gold + wage + profit) (owner, 2026-11-09, as in his retail contract). The site's
// calculator and the showcase prices use it.
export const TAX = 0.03;
export const TAX_FA = "۳٪";

// «آیین‌نامه‌ی خرید تکی» for retail buyers (kinds of business in the «مشتری تک‌فروشی» group), in plain words from the
// owner's own contract «قرارداد فروش جواهرات (خرید تک فروشی …)» (2026-11-09). The e-signature in «حساب من» (name, national
// code, mobile of the account) stands for the blanks of the paper copy. Any change makes them sign again.
export const RULES_RETAIL: { title: string; items?: string[]; text?: string }[] = [
  { title: "این آیین‌نامه", items: [
    "این آیین‌نامه برای خرید تکی مشتریان (مصرف‌کننده) از لئون گلد است و شامل عمده‌فروشی نمی‌شود.",
    "با تأیید آن در «حساب من»، برای هر خرید و سفارش شما پذیرفته می‌شود. نام، کد ملی و شماره تماسِ حساب شما به‌جای امضای کاغذی است.",
  ] },
  { title: "کالا", items: [
    "همه‌ی کارها طلای ۱۸ عیار (۷۵۰) و اصل است.",
  ] },
  { title: "قیمت و پرداخت", items: [
    "قیمت هر کار برابر است با طلا به نرخ همان روز و ساعت خرید، به‌اضافه‌ی اجرت ساخت، سود فروشنده و سه درصد (۳٪) مالیات بر ارزش افزوده روی کل مبلغ. همه در فاکتور نوشته می‌شود.",
    "قیمتی که هنگام خرید در فاکتور ثبت شد قطعی است؛ بالا یا پایین رفتن قیمت طلا بعد از خرید آن را عوض نمی‌کند.",
    "برای ثبت سفارش، ده درصد مبلغ کل به‌عنوان بیعانه پرداخت می‌شود و سفارش با واریز آن قطعی می‌شود.",
    "بقیه‌ی مبلغ هنگام تحویل پرداخت می‌شود، یا طبق شرایطی که در «حساب من» نوشته شده.",
  ] },
  { title: "تحویل", items: [
    "کار بعد از پرداخت کامل تحویل داده می‌شود؛ زمان و محل تحویل در «حساب من» ثبت می‌شود.",
    "هنگام تحویل، کار را بررسی کنید که سالم و درست باشد.",
  ] },
  { title: "تعویض", items: [
    "اگر کار ایراد داشت یا اشتباه تحویل شده بود، تا ۲۴ ساعت بعد از تحویل و با تأیید لئون گلد تعویض می‌شود.",
    "ایراد یا خرابی‌ای که هنگام تحویل دیده شود هم تعویض می‌شود.",
  ] },
  { title: "لغو سفارش", items: [
    "اگر بعد از شروع تهیه‌ی کار سفارش را لغو کنید، بیعانه (ده درصد مبلغ کل) برای جبران خسارت برداشته می‌شود و بقیه‌ی پولتان برمی‌گردد.",
    "جز ایراد کالا (بند تعویض) یا لغو سفارش با برداشتن بیعانه، خرید قابل فسخ نیست.",
  ] },
  { title: "اختلاف", text: "اگر اختلافی پیش آمد، اول با گفت‌وگو حل می‌کنیم؛ اگر تا هفت روز حل نشد، مراجع قضایی تصمیم می‌گیرند." },
  { title: "اطلاعات تماس و مدارک", items: [
    "نشانی و شماره‌ای که در «حساب من» دارید، نشانی رسمی شماست؛ اگر عوض شد، ظرف سه روز کاری در «پروفایل من» یا تلگرام خبر دهید.",
    "فاکتور و ریز سفارش در «حساب من» جزء این آیین‌نامه است.",
  ] },
];
// which rules a party signs: retail buyers the retail ones, everyone else (the trade) the full ones
export const rulesFor = (group?: string) => group === "retail" ? RULES_RETAIL : RULES;
export const rulesTitleFor = (group?: string) => group === "retail" ? "آیین‌نامه‌ی خرید تکی · لئون گلد" : "آیین‌نامه‌ی خرید و فروش کالا · لئون گلد";
let rulesGroup = "";
export const setRulesGroup = (g?: string) => { rulesGroup = g || ""; };
export const rulesGroupNow = () => rulesGroup;

// The ledger app: on the GitHub preview it is the app one level above the site; on real hosting it is /daftar/.
export const LEDGER = process.env.PREVIEW_BASE ? process.env.PREVIEW_BASE.replace(/\/site\/?$/, "/") : "/daftar/";

// The lion in gold: museum pieces shown as the craft's history, never as Leon Gold's own work.
export type Exhibit = { src: string; w: number; h: number; name: string; note: string; place: string; credit: string; page: string };
export const EXHIBITS: Exhibit[] = [
  { src: "/museum/dark/plaque-with-horned-lion-griffins.webp", w: 1387, h: 1787, name: "شیردال‌های شاخ‌دار", note: "پلاک طلا با دو شیرِ بالدار، سده‌ی ششم تا چهارم پیش از میلاد.", place: "موزه‌ی متروپولیتن",
    credit: "The Met, Open Access (CC0)", page: "https://www.metmuseum.org/art/collection/search/324290" },
  { src: "/museum/dark/ars-summum-tesoro-oxus-brazalete.webp", w: 1147, h: 1248, name: "دستبند گنجینه‌ی جیحون", note: "دستبند طلای هخامنشی با دو سرِ جانورِ افسانه‌ای رو در رو.", place: "گنجینه‌ی جیحون",
    credit: "Manuel de Corselas, public domain, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:Ars_Summum_Tesoro_Oxus_brazalete.JPG" },
  { src: "/museum/dark/lion-head-armlet-terminals-iran-achaemenid-period.webp", w: 879, h: 1670, name: "سرِ شیر بر بازوبند", note: "دو سرِ شیر که دو سرِ یک بازوبند طلا را می‌بستند؛ ایران، دوره‌ی هخامنشی.", place: "موزه‌ی هنر سینسیناتی",
    credit: "Daderot, CC0, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:Lion-head_armlet_terminals,_Iran,_Achaemenid_period,_5th_or_4th_century_BC,_gold_-_Cincinnati_Art_Museum_-_DSC03945.JPG" },
  { src: "/museum/dark/seljuk-islamic-gold-earrings-28702857995.webp", w: 1198, h: 588, name: "گوشواره‌های سلجوقی", note: "جفت گوشواره‌ی طلا با دانه‌های ریز، هزار سال پیش.", place: "موزه‌ی پرگامون، برلین",
    credit: "Gary Todd, CC0, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:Seljuk_Islamic_Gold_Earrings_(28702857995).jpg" },
  { src: "/museum/dark/5-pahlavi-iranian-golden-coin.webp", w: 1869, h: 1067, name: "پنج پهلوی، ۱۳۰۵", note: "سکه‌ی طلا با نشان شیر و خورشید؛ همان شیری که هنوز روی طلای ایران است.", place: "بانک ملی ایران",
    credit: "Bank Melli Iran, public domain, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:5_Pahlavi_-_Iranian_Golden_coin.jpg" },
];

export const HERO = { src: "/museum/dark/gold-lion-head-pendant.webp", w: 1714, h: 2188, alt: "آویز طلا به شکل سرِ شیر، قبرس، سده‌ی پنجم پیش از میلاد",
  credit: "The Met, Open Access (CC0)", page: "https://www.metmuseum.org/art/collection/search/242762" };

export const WORKBOX = { src: "/museum/goldsmith-s-workbox-mao-685-30.webp", w: 1280, h: 960, alt: "جعبه‌ی ابزار زرگر با ترازو و سنگ‌های وزن، ایران، ۱۷۰۹ میلادی",
  credit: "Rmashhadi, public domain, Wikimedia Commons (Louvre MAO 685)", page: "https://commons.wikimedia.org/wiki/File:Goldsmith%27s_workbox,_MAO_685_(30).jpg" };

export const MELT = { src: "/museum/the-crystallization-phenomenon-when-liquid-gold-solidifies.webm", poster: "/museum/the-crystallization-phenomenon-when-liquid-gold-solidifies-poster.webp",
  credit: "François Nguyen, CC BY 2.0, Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:The_crystallization_phenomenon_when_liquid_gold_solidifies_is_full_of_dendrites..webm" };

// SAMPLE collection: categories and typical ranges, to be replaced from the CRM panel
export const COLLECTION = [
  { name: "انگشتر", art: "ring", kind: "زنانه و مردانه", weight: "۲ تا ۸ گرم", ajrat: "اجرت از ۷٪" },
  { name: "گردنبند و آویز", art: "necklace", kind: "زنجیر، آویز، اسم", weight: "۳ تا ۱۵ گرم", ajrat: "اجرت از ۸٪" },
  { name: "دستبند", art: "bracelet", kind: "زنجیری و النگو", weight: "۴ تا ۲۰ گرم", ajrat: "اجرت از ۷٪" },
  { name: "گوشواره", art: "earring", kind: "میخی، حلقه، آویز", weight: "۱ تا ۶ گرم", ajrat: "اجرت از ۹٪" },
  { name: "سرویس", art: "set", kind: "گردنبند، دستبند و گوشواره", weight: "۱۰ تا ۴۰ گرم", ajrat: "اجرت از ۸٪" },
  { name: "سکه و شمش", art: "coin", kind: "بهار آزادی، گرمی، شمش", weight: "از ۱ گرم", ajrat: "بدون اجرت ساخت" },
];

export const STEPS = [
  { verb: "ببین", line: "کار را در فروشگاه ببین؛ وزن و عیارش روی برچسب نوشته شده." },
  { verb: "بپرس", line: "قیمت را با نرخ همین ساعتِ اتحادیه و اجرتِ همان کار حساب می‌کنیم." },
  { verb: "سفارش بده", line: "اسم و شماره‌ات را بگذار؛ در ساعت کاری تماس می‌گیریم و جزئیات را می‌گوییم." },
  { verb: "تحویل بگیر", line: "با فاکتور، وزن دقیق و عیار ۷۵۰، حضوری در فروشگاه." }, // SAMPLE: delivery options
];
