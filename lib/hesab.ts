// «حساب من», the panel for Leon Gold's customers and suppliers. It reads their own share of the ledger from the
// sync server's portal API (leon-gold-server/portal.mjs): sign-in by an SMS code to the mobile on their ledger card,
// or by a one-time link the owner sends. Read-only; nothing here writes ledger data.

export const SERVER = process.env.NEXT_PUBLIC_SYNC_URL || "https://leon-gold.liara.run";

export type Line = { desc: string; qty: number; weight: number; carat: number; ret?: boolean; totalG?: number; amount?: number };
export type Entry = { ts: string; date?: string; label: string; u: "g" | "r"; d: number; run: number; lines?: Line[] };
export type Order = { ref: string; date: string; due: string; status: string; statusLabel: string; deposit: number; items: { desc: string; qty: number; weight: number; carat: number }[] };
export type Work = { ref: string; date: string; due: string; status: string; statusLabel: string; desc: string; qty: number; weight: number; carat: number };
export type Account = { id: string; name: string; shop: string; kind: "customer" | "supplier" | "both"; bal: { g: number; r: number }; ent: Entry[]; orders: Order[]; work: Work[] };
export type Me = { accounts: Account[]; updated?: string; demo?: boolean };

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

export const startSms = (phone: string) => api<{ ok: true; wait: number }>("/api/portal/start", { phone });
export async function verifySms(phone: string, code: string) { setToken((await api<{ token: string }>("/api/portal/verify", { phone, code })).token); }
export async function redeem(k: string) { setToken((await api<{ token: string }>("/api/portal/redeem", { k })).token); }
export async function me(): Promise<Me> {
  try { return await api<Me>("/api/portal/me"); }
  catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) setToken(null); throw e; }
}
export async function logout() { try { await api("/api/portal/logout", {}); } catch {} setToken(null); }

// ---------- the owner's side: a one-time sign-in link for a party, or signing them out everywhere ----------
// Called with the owner's sync token (the CRM panel's sign-in), never the party's.
async function ownerApi<T>(token: string, path: string, partyId: string): Promise<T> {
  let r: Response;
  try { r = await fetch(SERVER + path, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ partyId }), cache: "no-store" }); }
  catch { throw new ApiError("offline", 0); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(j.error || "server", r.status, j);
  return j as T;
}
// the link is built on this page's own address, so it follows the site when it moves to the shop's domain
export async function invite(token: string, partyId: string) {
  const r = await ownerApi<{ k: string; days: number }>(token, "/api/portal/invite", partyId);
  return { link: location.origin + location.pathname + "#k=" + r.k, days: r.days };
}
export const revoke = (token: string, partyId: string) => ownerApi<{ ok: true }>(token, "/api/portal/revoke", partyId);

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

// ---------- a sample account for the preview, plainly marked as one; never real people ----------
export const SAMPLE: Me = {
  demo: true,
  updated: new Date().toISOString(),
  accounts: [
    {
      id: "demo-c", name: "مشتری نمونه", shop: "", kind: "both", bal: { g: -1.25, r: 18500000 },
      ent: [
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
