// CRM panel data: it signs in to the ledger's sync server (leon-gold-server) with the owner's own login.
// Customers and invoices are the ledger's and are only read here; the panel writes its own collections
// (crm_people: what we know about a customer; crm_leads: requests that are not invoices yet), which the ledger keeps but never shows.

export const SERVER = process.env.NEXT_PUBLIC_SYNC_URL || "https://leon-gold.liara.run";

export type Party = { id: string; name: string; kind?: string; shop?: string; phone?: string; address?: string; note?: string; ts?: string };
export type Item = { desc?: string; qty?: number; weight?: number; carat?: number; amount?: number };
export type Invoice = { id: string; kind: string; doc?: string; no?: string; date?: string; partyId?: string; partyName?: string; items?: Item[]; amount?: number; unit?: string; ts?: string };
export type Note = { at: string; text: string };
// md: a Persian month-day "M-D", so it comes round every year by the Persian calendar
export type Person = { birthday?: string; anniversary?: string; ring?: string; metal?: string; likes?: string; tags?: string[]; notes?: Note[]; nextAt?: string; nextNote?: string; upd?: string };
export type LeadStatus = "new" | "talking" | "won" | "lost";
export type Lead = { id: string; name: string; phone?: string; what?: string; note?: string; source?: string; status: LeadStatus; partyId?: string; ts: string; upd?: string };

export type Store = { parties: Record<string, Party>; invoices: Record<string, Invoice>; people: Record<string, Person>; leads: Record<string, Lead>; settlements: Record<string, unknown>; products: Record<string, unknown>; expenses: Record<string, unknown>; rev: number };
export const emptyStore = (): Store => ({ parties: {}, invoices: {}, people: {}, leads: {}, settlements: {}, products: {}, expenses: {}, rev: 0 });

// ---------- session ----------
const KEY = "leon-crm";
type Session = { token: string; user: string };
export function getSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function setSession(s: Session | null) {
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch {}
  dispatchEvent(new Event(KEY));
}
// for useSyncExternalStore: who is signed in, and a way to hear when that changes (here or in another tab)
export const sessionUser = () => getSession()?.user ?? null;
export function onSession(f: () => void) {
  addEventListener(KEY, f); addEventListener("storage", f);
  return () => { removeEventListener(KEY, f); removeEventListener("storage", f); };
}

export class LoginNeeded extends Error {}

async function api<T>(path: string, init: { method?: string; json?: unknown } = {}): Promise<T> {
  const s = getSession(), headers: Record<string, string> = {};
  if (s) headers.Authorization = "Bearer " + s.token;
  if (init.json !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(SERVER + path, { method: init.method || "GET", headers, body: init.json === undefined ? undefined : JSON.stringify(init.json), cache: "no-store" });
  if (r.status === 401) { if (s && path !== "/api/login") setSession(null); throw new LoginNeeded(); }
  if (r.status === 429) throw new Error("too_many");
  if (!r.ok) throw new Error("server " + r.status);
  return r.json();
}

export async function login(u: string, p: string) {
  const r = await api<Session>("/api/login", { method: "POST", json: { u, p, device: "پنل مشتریان" } });
  setSession(r);
  return r.user;
}
export async function logout() {
  try { await api("/api/logout", { method: "POST", json: {} }); } catch {}
  setSession(null);
}

// ---------- a customer's card-to-card receipt: pending until the owner records the real document in the ledger by hand ----------
export type Receipt = { id: string; party: string; partyName: string; blob: string; amount: number | null; date: string; ts: number; status: "pending" | "done" };
export const receipts = () => api<{ receipts: Receipt[] }>("/api/portal/receipts").then(r => r.receipts);
export const receiptDone = (id: string) => api<{ ok: true }>("/api/portal/receipt/" + encodeURIComponent(id) + "/done", { method: "POST", json: {} });
// the owner's own ledger session reads any blob by id (product photos and these receipts alike); never a public URL
export async function receiptPhotoUrl(blob: string): Promise<string> {
  const s = getSession(), headers: Record<string, string> = {};
  if (s) headers.Authorization = "Bearer " + s.token;
  const r = await fetch(SERVER + "/api/blob/" + encodeURIComponent(blob), { headers, cache: "no-store" });
  if (!r.ok) throw new LoginNeeded();
  return URL.createObjectURL(await r.blob());
}

// ---------- pull and push ----------
type Change = { c: string; id: string; d: unknown };
const COLS: Record<string, keyof Omit<Store, "rev">> = { parties: "parties", invoices: "invoices", crm_people: "people", crm_leads: "leads", settlements: "settlements", products: "products", expenses: "expenses" };

export async function pull(st: Store): Promise<Store> {
  const next: Store = { ...st, parties: { ...st.parties }, invoices: { ...st.invoices }, people: { ...st.people }, leads: { ...st.leads }, settlements: { ...st.settlements }, products: { ...st.products }, expenses: { ...st.expenses } };
  for (let more = true; more; ) {
    const r = await api<{ rev: number; more: boolean; changes: Change[] }>("/api/pull?since=" + next.rev);
    for (const ch of r.changes) {
      const k = COLS[ch.c];
      if (!k) continue;
      const m = next[k] as Record<string, unknown>;
      if (ch.d == null) delete m[ch.id];
      else m[ch.id] = { ...(ch.d as object), id: ch.id };
    }
    next.rev = r.rev;
    more = r.more;
  }
  return next;
}

// only ever writes the panel's own collections
export async function save(col: "crm_people" | "crm_leads", id: string, d: object | null) {
  if (d) { const rest = { ...d } as { id?: string }; delete rest.id; d = rest; }
  await api("/api/push", { method: "POST", json: { changes: [{ c: col, id, d }] } });
}
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- digits, money, phones ----------
export const fa = (n: number, max = 0) => n.toLocaleString("fa-IR", { maximumFractionDigits: max });
export const latin = (s: string) => s.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
export const toFa = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

// rial to a short toman figure: «۱۲۰ میلیون»
export function toman(rial: number) {
  const t = rial / 10;
  if (t >= 1e9) return fa(t / 1e9, 2) + " میلیارد";
  if (t >= 1e6) return fa(t / 1e6, t >= 1e8 ? 0 : 1) + " میلیون";
  if (t >= 1e3) return fa(t / 1e3, 0) + " هزار";
  return fa(t);
}

// 0912… → 98912…, for wa.me and tel:
export function phoneIntl(p?: string) {
  const d = latin(p || "").replace(/\D/g, "");
  if (d.length < 10) return "";
  if (d.startsWith("98")) return d;
  if (d.startsWith("0")) return "98" + d.slice(1);
  return d.length === 10 ? "98" + d : d;
}
export const waLink = (p: string | undefined, text: string) => { const n = phoneIntl(p); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : ""; };

// ---------- the Persian calendar ----------
export const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const jf = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tehran" });
export function jParts(d: Date) {
  const p = jf.formatToParts(d), g = (t: string) => +(p.find((x) => x.type === t)?.value || 0);
  return { y: g("year"), m: g("month"), d: g("day") };
}
const DAY = 864e5;
export const dayNo = (d: Date) => Math.floor((d.getTime() + 3.5 * 36e5) / DAY); // Tehran days
export const today = () => dayNo(new Date());

// days until each Persian month-day comes round next, built once a day (0 = today)
let ahead: { day: number; map: Map<string, number> } | null = null;
export function daysUntil(md?: string) {
  if (!md) return null;
  const t = today();
  if (!ahead || ahead.day !== t) {
    const map = new Map<string, number>(), now = Date.now();
    for (let i = 0; i < 370; i++) { const j = jParts(new Date(now + i * DAY)), k = j.m + "-" + j.d; if (!map.has(k)) map.set(k, i); }
    ahead = { day: t, map };
  }
  // 30 Esfand only in leap years: then it falls on 29 Esfand
  return ahead.map.get(md) ?? (md === "12-30" ? ahead.map.get("12-29") ?? null : null);
}
export const mdLabel = (md?: string) => { if (!md) return ""; const [m, d] = md.split("-").map(Number); return fa(d) + " " + MONTHS[m - 1]; };
export const jDate = (iso?: string) => { if (!iso) return ""; const j = jParts(new Date(iso)); return toFa(`${j.y}/${String(j.m).padStart(2, "0")}/${String(j.d).padStart(2, "0")}`); };
export function ago(iso?: string) {
  if (!iso) return "";
  const n = today() - dayNo(new Date(iso));
  if (n <= 0) return "امروز";
  if (n === 1) return "دیروز";
  if (n < 30) return fa(n) + " روز پیش";
  if (n < 365) return fa(Math.round(n / 30)) + " ماه پیش";
  return fa(Math.round(n / 365)) + " سال پیش";
}

// ---------- what the panel works out ----------
export type Client = { party: Party; person: Person; invoices: Invoice[]; spent: number; grams: number; last?: string };
export function clients(st: Store): Client[] {
  const by: Record<string, Invoice[]> = {};
  for (const i of Object.values(st.invoices)) if (i.partyId && i.doc !== "rc") (by[i.partyId] ||= []).push(i);
  return Object.values(st.parties)
    .filter((p) => p.kind !== "supplier")
    .map((party) => {
      const invoices = (by[party.id] || []).sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
      let spent = 0, grams = 0;
      for (const i of invoices) {
        if (i.kind === "retail") spent += Math.max(0, i.amount || 0);
        for (const it of i.items || []) grams += +(it.weight || 0); // a row's weight is the whole row's, whatever the count
      }
      return { party, person: st.people[party.id] || {}, invoices, spent, grams, last: invoices[0]?.ts };
    });
}

export const LEAD_STATUS: Record<LeadStatus, string> = { new: "تازه", talking: "در گفت‌وگو", won: "خرید کرد", lost: "منصرف شد" };
export const SOURCES = ["سایت", "واتس‌اپ", "اینستاگرام", "تلفن", "حضوری"];
export const METALS = ["زرد", "سفید", "رزگلد"];
