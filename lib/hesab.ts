// «حساب من», the panel for Leon Gold's customers and suppliers. It reads their own share of the ledger from the
// sync server's portal API (leon-gold-server/portal.mjs): sign-in by an SMS code to the mobile on their ledger card,
// or by a one-time link the owner sends. Read-only; nothing here writes ledger data.

export const SERVER = process.env.NEXT_PUBLIC_SYNC_URL || "https://api.leongold.net";

export type Line = { desc: string; qty: number; weight: number; carat: number; ret?: boolean; totalG?: number; amount?: number; photo?: string };
// one saved invoice for the ledger's own sheet (leon-gold-server/portal.mjs sheetOf; shown by components/hesab/Invoice.tsx)
export type Sheet = { kind: "whole" | "retail"; doc: string; no: string; date: string; vals: string[]; rows: number; tax: string; gp: number; rets: number[]; disc2: string[]; rprev: [string, string] | null;
  gold: { type: string; weight: number; purity: string; lab: string; ang: string; note: string }[]; goldDir: string; trade: { type: string; mode: string; w: number; gp: number; amount: number; note: string; cin: number; cout: number } | null; hav: { partyId: string; partyName: string; w: number; dir: string } | null };
export type Entry = { ts: string; date?: string; label: string; u: "g" | "r"; d: number; run: number; lines?: Line[]; sheet?: Sheet; gross?: number };
export type Order = { ref: string; date: string; due: string; status: string; statusLabel: string; deposit: number; items: { desc: string; qty: number; weight: number; carat: number; photo?: string }[] };
export type Work = { ref: string; date: string; due: string; status: string; statusLabel: string; desc: string; qty: number; weight: number; carat: number; photo?: string };
// the way to VIP (owner, 2026-11-13; leon-gold-server/portal.mjs vipOf): for a party that is not VIP, its three steps;
// a VIP gets only { is: true }. VIP itself stays the owner's own mark in the ledger.
export type VipStep = { k: "settle" | "grams" | "invite"; have: number; need: number; done: boolean };
export type VipWay = { is: boolean; steps?: VipStep[]; all?: boolean };
export type Account = { id: string; name: string; shop: string; phone?: string; vip?: boolean; vipWay?: VipWay; market?: boolean; upload?: boolean; kind: "customer" | "supplier" | "both"; biz?: string; group?: "colleague" | "retail" | ""; bal: { g: number; r: number }; ent: Entry[]; orders: Order[]; work: Work[] };
// what the party wrote about itself (all optional) and its last signature of the rules (leon-gold-server/portal.mjs)
export type Info = { fullName?: string; nationalId?: string; birth?: string; mobile?: string; phone?: string; shop?: string; address?: string; postal?: string; email?: string; at?: number };
export type Me = { accounts: Account[]; updated?: string; demo?: boolean; username?: string; photo?: string; terms?: { hash: string; at: number } | null; info?: Info | null };

// ---------- session: the token only, in this browser ----------
const KEY = "leon-hesab";
export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const setToken = (t: string | null) => { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch {} };

export class ApiError extends Error { constructor(public code: string, public status: number, public extra: Record<string, unknown> = {}) { super(code); } }

async function api<T>(path: string, json?: unknown): Promise<T> {
  const t = getToken(), headers: Record<string, string> = {};
  if (t) headers.Authorization = "Bearer " + t;
  if (json !== undefined) headers["Content-Type"] = "application/json";
  let r: Response;
  try { r = await fetch(SERVER + path, { method: json === undefined ? "GET" : "POST", headers, body: json === undefined ? undefined : JSON.stringify(json), cache: "no-store" }); }
  catch { throw new ApiError("offline", 0); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(j.error || "server", r.status, j);
  return j as T;
}

// the rules as one text, the exact words the party signs; its SHA-256 tells whether it signed this version
export const termsHash = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))).map(b => b.toString(16).padStart(2, "0")).join("");
export const acceptTerms = (text: string, label: string) => api<{ ok: true; hash: string; at: number }>("/api/portal/terms/accept", { text, label });
// the party's own profile photo (owner, 2026-11-09): shrunk to a small square-ish JPEG here, kept on the server
export const setAvatar = (image: string) => api<{ ok: true; photo: string }>("/api/portal/avatar", { image });
// the party's invite code (owner, 2026-11-09) and how many signed up with it
export const invite = () => api<{ code: string; joined: number }>("/api/portal/invite");
// a code that came in a link (?ref=…), kept for this visit so it survives a reload or a detour
export function refFromLink(): string {
  if (typeof location === "undefined") return "";
  const r = (new URLSearchParams(location.search).get("ref") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  try { if (r) sessionStorage.setItem("leon-ref", r); return r || sessionStorage.getItem("leon-ref") || ""; } catch { return r; }
}
export const removeAvatar = () => api<{ ok: true }>("/api/portal/avatar/remove", {});
export const saveInfo = (info: Info) => api<{ ok: true; info: Info }>("/api/portal/info", info);

export async function login(u: string, p: string) { setToken((await api<{ token: string }>("/api/portal/login", { u, p })).token); }
// the party replaces the starting username or password Leon gave it, with its current password; a new password signs
// its other devices out, this one stays in
export const changeLogin = (old: string, c: { username?: string; password?: string }) =>
  api<{ ok: true; username: string }>("/api/portal/password", { old, ...(c.username != null ? { username: c.username } : {}), ...(c.password != null ? { new: c.password } : {}) });
// «ثبت نام» (2026-11-09): the request waits for Leon Gold's approval in the ledger; then this username and password sign in
export type BizType = { k: string; name: string; group: "colleague" | "retail" };
export const publicBiz = async () => (await api<{ types: BizType[] }>("/api/public/biz")).types;
// no approval (owner, 2026-11-09): the account is made at once and this browser is signed in
export type Signup = { fullName: string; mobile: string; nationalId: string; biz: string; shop?: string; city?: string; birth?: string; licence?: string; union?: string; shopAddr?: string; username: string; password: string; note?: string; ref?: string };
export async function signup(d: Signup) { const r = await api<{ ok: true; username: string; token: string }>("/api/portal/signup", d); setToken(r.token); return r; }
// an Iranian national code: 10 digits with its check digit (the server checks the same)
export const nidOk = (s: string) => { if (!/^\d{10}$/.test(s) || /^(\d)\1{9}$/.test(s)) return false; const c = +s[9], m = [...s.slice(0, 9)].reduce((a, d, i) => a + +d * (10 - i), 0) % 11; return m < 2 ? c === m : c === 11 - m; };
export async function redeem(k: string) { setToken((await api<{ token: string }>("/api/portal/redeem", { k })).token); }
export async function me(): Promise<Me> {
  try { return await api<Me>("/api/portal/me"); }
  catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setToken(null); throw e; }
}
export async function logout() { try { await api("/api/portal/logout", {}); } catch {} setToken(null); }

// ---------- a line item's product photo, or a receipt's own photo: fetched with this party's token, never a public URL ----------
export async function photoUrl(id: string): Promise<string> {
  const t = getToken(), headers: Record<string, string> = {};
  if (t) headers.Authorization = "Bearer " + t;
  const r = await fetch(SERVER + "/api/portal/photo/" + encodeURIComponent(id), { headers, cache: "no-store" });
  if (!r.ok) throw new ApiError(r.status === 401 ? "login" : "not_found", r.status);
  return URL.createObjectURL(await r.blob());
}

// ---------- the customer's card-to-card receipt: a photo (shrunk here, before it ever leaves the phone), an optional amount and date ----------
// mirrors the ledger's own shrink(): longest side capped, re-encoded as a smaller JPEG
export function shrinkPhoto(file: File, max = 1280, quality = 0.82): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      const ctx = c.getContext("2d");
      if (!ctx) return rej(new Error("canvas"));
      ctx.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src = url;
  });
}
export const sendReceipt = (image: string, amount?: number, date?: string) => api<{ ok: true }>("/api/portal/receipt", { image, amount, date });
// the receipts this party sent, newest first, each pending until Leon records the real document in the ledger
// ---------- «ویترین»: the pieces on show (the owner puts them in the ledger), their photos and films, and an order ----------
// mine: a supplier's own piece («محصولات شما در لئون»): no wage, profit, tax or price
export type VItem = { id: string; code: string; tags?: string[]; mine?: boolean; status?: "pending" | "live" | "hidden"; supAjrat?: number | null; name: string; cat: string; desc: string; weight: number; carat: number; ajrat: number; profit: number; settle: string[]; settleNote?: string; stock: "qty" | "order" | "none"; qty: number; sold: boolean; media: { id: string; type: "image" | "video" }[] };
// a supplier the owner allows sends its own pieces (owner, 2026-11-10): a photo or film first, then the piece
export const studioMedia = (data: string) => api<{ ok: true; id: string; type: "image" | "video" }>("/api/portal/studio/media", { data });
export const studioSave = (d: { id?: string; name: string; cat: string; groups: string[]; weight: string; carat: number; supAjrat: string; qty: string; desc: string; media: { id: string; type: string }[] }) => api<{ ok: true; id: string }>("/api/portal/studio/save", d);
// a supplier's new category (owner, 2026-11-13): an existing one is reused (exists), else it waits for Leon (pending)
export const studioCat = (name: string) => api<{ ok: true; cat: string; exists?: boolean; pending?: boolean }>("/api/portal/studio/cat", { name });
export const studioRemove = (id: string) => api<{ ok: true }>("/api/portal/studio/remove", { id });
// the showcase's «کتگوری»‌ها and «گروه»‌ها (owner, 2026-11-13) come with the pieces, from the owner's lists in the ledger; a
// server that does not send them yet gets the defaults (the old fixed categories; لیزری، ریخته، پایه جواهر، بچگانه)
export type VCat = { k: string; name: string; alias?: string[] };
export type VGroup = { k: string; name: string };
export const VCATS_DEFAULT: VCat[] = [["ring", "انگشتر"], ["necklace", "گردنبند"], ["bracelet", "دستبند"], ["earring", "گوشواره"], ["halfset", "نیم‌ست"], ["set", "سرویس"],
  ["medal", "مدال"], ["chain", "زنجیر"], ["anklet", "پابند"], ["bangle", "النگو"], ["pendant", "پلاک و آویز"]].map(([k, name]) => ({ k, name }));
export const VGROUPS_DEFAULT: VGroup[] = [{ k: "laser", name: "لیزری" }, { k: "cast", name: "ریخته" }, { k: "jewel", name: "پایه جواهر" }, { k: "kids", name: "بچگانه" }];
export type Showcase = { items: VItem[]; mine: VItem[]; cats: VCat[]; groups: VGroup[]; myCats: string[] };
type Raw = { items: VItem[]; mine?: VItem[]; cats?: VCat[]; groups?: VGroup[]; myCats?: string[] };
const showcase = (r: Raw): Showcase => ({ items: r.items, mine: r.mine || [], cats: Array.isArray(r.cats) && r.cats.length ? r.cats : VCATS_DEFAULT,
  groups: Array.isArray(r.groups) ? r.groups : VGROUPS_DEFAULT, myCats: Array.isArray(r.myCats) ? r.myCats : [] });
export const vitrin = async () => showcase(await api<Raw>("/api/portal/vitrin"));
// the public site's showcase (no sign-in): pieces the owner marked «روی سایت», at the site's wage
export const publicVitrin = async () => showcase(await api<Raw>("/api/public/vitrin"));
export const publicMedia = (id: string) => SERVER + "/api/public/media/" + encodeURIComponent(id);
// an order waits 120 s for Leon's confirmation (owner, 2026-11-09): its price goes with it and follows the rate
export const orderItem = (id: string, note: string, gp?: number, total?: number) => api<{ ok: true; id: string; exp: number; wait: number }>("/api/portal/vitrin/order", { id, note, gp, total });
export const orderStatus = (lid: string) => api<{ status: "waiting" | "confirmed" | "expired"; left: number; price: { gp: number; total: number } | null }>("/api/portal/vitrin/order/" + encodeURIComponent(lid));
export const orderPrice = (lid: string, gp: number, total: number) => api<{ ok: true }>("/api/portal/vitrin/order/" + encodeURIComponent(lid) + "/price", { gp, total });
export async function mediaUrl(id: string): Promise<string> {
  const t = getToken(), headers: Record<string, string> = {};
  if (t) headers.Authorization = "Bearer " + t;
  const r = await fetch(SERVER + "/api/portal/media/" + encodeURIComponent(id), { headers });
  if (!r.ok) throw new ApiError(r.status === 401 ? "login" : "not_found", r.status);
  return URL.createObjectURL(await r.blob());
}
// the sample account's showcase: no photos (a gold leaf stands in), made-up pieces
export const SAMPLE_VITRIN: VItem[] = [
  { id: "s1", code: "R12", name: "انگشتر سولیتر", cat: "انگشتر", desc: "نمونه: یک نگین درخشان روی رکاب ظریف.", weight: 3.45, carat: 750, ajrat: 18, profit: 7, settle: ["نقدی پای کفه"], stock: "qty", qty: 2, sold: false, media: [] },
  { id: "s2", code: "N4", name: "گردنبند پلاک گرد", cat: "گردنبند", desc: "نمونه: پلاک گرد با نقش پیچ.", weight: 6.2, carat: 750, ajrat: 15, profit: 7, settle: ["۳ روز", "۱ هفته"], stock: "order", qty: 0, sold: false, media: [] },
  { id: "s3", code: "E7", name: "گوشواره آویز", cat: "گوشواره", desc: "نمونه: قطره‌ی طلا روی زنجیر کوتاه.", weight: 2.8, carat: 750, ajrat: 20, profit: 7, settle: ["نقدی پای کفه"], stock: "none", qty: 0, sold: true, media: [] },
];
export type MyReceipt = { id: string; blob: string; amount: number | null; date: string; ts: number; status: "pending" | "done" };
export const myReceipts = async () => (await api<{ receipts: MyReceipt[] }>("/api/portal/receipts/mine")).receipts;

// ---------- Persian numbers and dates ----------
const FA = "۰۱۲۳۴۵۶۷۸۹";
export const faDigits = (s: string | number) => String(s).replace(/\d/g, d => FA[+d]);
export const latin = (s: string) => s.replace(/[۰-۹]/g, d => String(FA.indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
export const gram = (n: number) => Math.abs(n).toLocaleString("fa-IR", { maximumFractionDigits: 3 });
export const rial = (n: number) => Math.abs(Math.round(n)).toLocaleString("fa-IR");
export const toman = (n: number) => Math.abs(Math.round(n / 10)).toLocaleString("fa-IR");
export const jdate = (ts?: string) => { try { return ts ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts)) : ""; } catch { return ""; } };
export const jtime = (ts?: string) => { try { return ts ? new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ts)) : ""; } catch { return ""; } };
// ledger dates are written "۱۴۰۵/۰۸/۰۵"; a number to compare them by, or 0 when it is not one
export const dayNum = (s: string) => { const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(latin(s || "").trim()); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0; };
export const today = () => dayNum(jdate(new Date().toISOString()));

// the ledger's sign: above zero the party owes Leon (بدهکار), below it Leon owes them (بستانکار)
export const side = (v: number, u: "g" | "r") => (Math.abs(v) < (u === "g" ? 0.0005 : 0.5) ? "z" : v > 0 ? "dr" : "cr");

const SAMPLE_SHEET: Sheet = { kind: "whole", doc: "pd", no: "۴۲", date: "۱۴۰۵/۰۷/۳۰", rows: 8, tax: "۰", gp: 78000000, rets: [2], disc2: ["", "", ""], rprev: ["", "dr"],
  vals: ["۱۴۰۵/۰۷/۳۰", "۴۲", "۱۴۰۵/۰۸/۲۵", "pd", "مشتری نمونه", "گالری نمونه", "09120000000", "تهران، بازار بزرگ", "النگو تراش", "۲", "۱۲٫۴۰", "", "۳", "دستبند کارتیه", "۱", "۶٫۸", "", "۵", "انگشتر ساده", "۱", "۲٫۱", "۷۴۰", "",
    ...Array(25).fill(""), "۷۸٬۰۰۰٬۰۰۰", "", "۱٫۲۵", "cr", "dl", "۲", "cr", "", "cr", "", "نمونه‌ی فاکتور عمده"],
  gold: [{ type: "ab", weight: 3, purity: "۷۴۰", lab: "آزمایشگاه نمونه", ang: "", note: "" }], goldDir: "cr",
  trade: { type: "sell", mode: "w", w: 5, gp: 78000000, amount: 390000000, note: "", cin: 200000000, cout: 0 }, hav: null };
// ---------- a sample account for the preview, plainly marked as one; never real people ----------
export const SAMPLE: Me = {
  demo: true,
  updated: new Date().toISOString(),
  accounts: [
    {
      id: "demo-c", name: "مشتری نمونه", shop: "", phone: "09120000000", kind: "both", vip: true, market: true, upload: true, bal: { g: 10.774, r: 208500000 },
      ent: [
        { ts: "2026-10-22T10:00:00Z", date: "۱۴۰۵/۰۷/۳۰", label: "فروش طلا و نقدی · فاکتور عمده ۴۲", u: "r", d: 190000000, run: 208500000, sheet: SAMPLE_SHEET },
        { ts: "2026-10-22T10:00:00Z", date: "۱۴۰۵/۰۷/۳۰", label: "فاکتور عمده ۴۲", u: "g", d: 12.024, run: 10.774, lines: [{"desc":"النگو تراش","qty":2,"weight":12.4,"carat":750,"totalG":12.772},{"desc":"دستبند کارتیه","qty":1,"weight":6.8,"carat":750,"totalG":7.14},{"desc":"انگشتر ساده","qty":1,"weight":2.1,"carat":740,"totalG":2.072,"ret":true}], sheet: SAMPLE_SHEET },
        { ts: "2026-10-20T10:00:00Z", date: "۱۴۰۵/۰۷/۲۸", label: "دریافت لئون از شما", u: "r", d: -6500000, run: 18500000 },
        { ts: "2026-10-14T10:00:00Z", date: "۱۴۰۵/۰۷/۲۲", label: "فاکتور خرده ۱۲۴", u: "r", d: 25000000, run: 25000000,
          lines: [{ desc: "انگشتر نگین‌دار", qty: 1, weight: 3.42, carat: 18, amount: 25000000 }] },
        { ts: "2026-10-02T10:00:00Z", date: "۱۴۰۵/۰۷/۱۰", label: "سند دریافتی عمده ۳۱", u: "g", d: -1.25, run: -1.25,
          lines: [{ desc: "طلای آبشده", qty: 1, weight: 1.3, carat: 720, totalG: 1.25 }] },
      ],
      orders: [
        { ref: "A7K2", date: "۱۴۰۵/۰۸/۰۱", due: "۱۴۰۵/۰۸/۲۰", status: "src", statusLabel: "در حال تهیه", deposit: 10000000, items: [{ desc: "گردنبند اسم", qty: 1, weight: 4, carat: 18 }] },
        { ref: "Q3M9", date: "۱۴۰۵/۰۶/۱۲", due: "۱۴۰۵/۰۶/۳۰", status: "done", statusLabel: "تحویل شده", deposit: 0, items: [{ desc: "دستبند کارتیه", qty: 1, weight: 6.8, carat: 18 }] },
      ],
      work: [
        { ref: "B4T1", date: "۱۴۰۵/۰۸/۰۲", due: "۱۴۰۵/۰۸/۱۵", status: "src", statusLabel: "در حال تهیه", desc: "النگو ساده", qty: 2, weight: 12, carat: 18 },
      ],
    },
  ],
};

// ---------- push notifications (leon-gold-server/notify.mjs): this device's subscription, turned on from the profile ----------
export const pushKey = async () => (await api<{ key: string }>("/api/portal/push/key")).key;
export const pushSub = (s: PushSubscriptionJSON) => api<{ ok: true }>("/api/portal/push/sub", { endpoint: s.endpoint, keys: s.keys });
export const pushUnsub = (endpoint: string) => api<{ ok: true }>("/api/portal/push/unsub", { endpoint });
export const pushTest = () => api<{ ok: boolean; sent: number; results: { host: string; status: number; reason: string }[] }>("/api/portal/push/test", {});
