import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { GL_VARS } from "@/lib/guilloche";
import { THEME_BOOT } from "@/components/ThemeToggle";
import { LOADER_CSS } from "@/lib/loader";
import { MORPH_CSS } from "@/lib/morph";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "لئون گلد · خرید طلا و جواهرات ۱۸ عیار در تهران",
  description: "خرید طلا و جواهرات ۱۸ عیار از لئون گلد در تهران: انگشتر، گردنبند، دستبند و گوشواره‌ی طلا با قیمت زنده‌ی اتحادیه، محاسبه‌ی قیمت طلا با اجرت، سفارش در تلگرام و فروش عمده به همکاران.",
  icons: { icon: "/leaf.png", apple: "/leaf.png" },
  // the share card for WhatsApp and Telegram links; SITE_URL is the real domain once it exists
  metadataBase: new URL(process.env.SITE_URL || "https://leon-gold.github.io/leon-gold-app/site/"),
  openGraph: { siteName: "لئون گلد", title: "لئون گلد · طلا و جواهرات ۱۸ عیار در تهران", description: "طلا و جواهرات ۱۸ عیار در تهران. قیمت زنده‌ی اتحادیه و ثبت سفارش.", images: [{ url: "og.jpg", width: 1200, height: 630 }], locale: "fa_IR", type: "website" },
  twitter: { card: "summary_large_image", images: ["og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#07130e", width: "device-width", initialScale: 1, viewportFit: "cover" };

// between the site's pages (owner, 2026-11-10, second version): the browser's view transition, with the new page opening
// as a circle from where the finger touched (kept for a moment in sessionStorage) and a gold ring on its edge; the
// bar stays put (globals.css names it «lg-bar»), the old page sinks back. No tap (the back button): a soft cross-fade.
const VT_REVEAL = `(function(){var E="cubic-bezier(0.77, 0, 0.175, 1)";
function blocks(root){var out=[],vh=innerHeight;(function walk(n,d){for(var i=0;i<n.children.length&&out.length<16;i++){var c=n.children[i];if(c.matches(".bar,.door-bar,.mu-bar,.hs-bar,.pn-bar,.lg-old,.lg-ring,script,style"))continue;var r=c.getBoundingClientRect();if(r.bottom<0||r.top>vh||r.width<8||r.height<8)continue;var cs=getComputedStyle(c),plain=cs.backgroundColor==="rgba(0, 0, 0, 0)"&&cs.backgroundImage==="none"&&!parseFloat(cs.borderTopWidth)&&c.children.length>0;if(plain&&d<4)walk(c,d+1);else out.push(c)}})(root,0);return out}
function name(on){var L=blocks(document.body);L.forEach(function(c,i){c.style.viewTransitionName=on?"lg-k"+i:""});return L}
addEventListener("pageswap",function(e){if(e.viewTransition)name(true)});
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target||a.origin!==location.origin)return;try{sessionStorage.setItem("lg-tap",JSON.stringify({x:e.clientX,y:e.clientY,t:Date.now()}))}catch(x){}},true);
addEventListener("pagereveal",function(e){var vt=e.viewTransition;if(!vt)return;var L=name(true);vt.finished.finally(function(){L.forEach(function(c){c.style.viewTransitionName=""})});var t=null;try{t=JSON.parse(sessionStorage.getItem("lg-tap")||"null");sessionStorage.removeItem("lg-tap")}catch(x){}
var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
vt.ready.then(function(){var h=document.documentElement;
if(!t||Date.now()-t.t>5000||rm){h.animate({opacity:[0,1]},{duration:rm?160:300,easing:"ease",pseudoElement:"::view-transition-new(root)"});return}
var R=Math.hypot(Math.max(t.x,innerWidth-t.x),Math.max(t.y,innerHeight-t.y))+30;
h.animate({clipPath:["circle(0px at "+t.x+"px "+t.y+"px)","circle("+R+"px at "+t.x+"px "+t.y+"px)"]},{duration:640,easing:E,pseudoElement:"::view-transition-new(root)"});
h.animate({transform:["scale(1)","scale(.93)"],opacity:[1,.35],filter:["brightness(1)","brightness(.7)"]},{duration:640,easing:E,fill:"forwards",pseudoElement:"::view-transition-old(root)"});
var r=document.createElement("div");r.className="lg-ring";document.body.appendChild(r);
r.animate([{left:t.x+"px",top:t.y+"px",width:"0px",height:"0px",opacity:1},{left:t.x-R+20+"px",top:t.y-R+20+"px",width:2*R-40+"px",height:2*R-40+"px",opacity:.9,offset:.8},{left:t.x-R+20+"px",top:t.y-R+20+"px",width:2*R-40+"px",height:2*R-40+"px",opacity:0}],{duration:640,easing:E,fill:"forwards"}).onfinish=function(){r.remove()}})})})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /><style dangerouslySetInnerHTML={{ __html: LOADER_CSS + MORPH_CSS }} /><script dangerouslySetInnerHTML={{ __html: VT_REVEAL }} /></head>
      <body style={GL_VARS as CSSProperties}>{children}</body>
    </html>
  );
}
