"use client";
// The CRM panel: signs in to the sync server, keeps one copy of the store in memory (never in this browser's storage)
// and moves between its pages by the address hash, so the phone's back gesture works.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Client, LoginNeeded, Store, clients, emptyStore, login, logout, onSession, sessionUser, pull, save, type Lead, type Person } from "@/lib/crm";
import Today from "./Today";
import Clients from "./Clients";
import ClientPage from "./ClientPage";
import Leads from "./Leads";
import Numbers from "./Numbers";
import Door from "@/components/Door";

export type Route = { page: "today" | "clients" | "client" | "leads" | "numbers"; id?: string };
// a hand-typed or cut-off address can hold a broken %-escape; that must not stop the panel
const safeDecode = (s: string) => { try { return decodeURIComponent(s); } catch { return ""; } };
const parse = (h: string): Route => {
  const [p, id] = h.replace(/^#\/?/, "").split("/");
  return p === "clients" || p === "leads" || p === "numbers" ? { page: p } : p === "c" && id ? { page: "client", id: safeDecode(id) } : { page: "today" };
};
const onHash = (f: () => void) => { addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); };

export type Act = {
  person: (id: string, p: Person) => Promise<void>;
  lead: (l: Lead | null, id?: string) => Promise<void>;
};

export default function Panel() {
  const user = useSyncExternalStore(onSession, sessionUser, () => undefined);
  const hash = useSyncExternalStore(onHash, () => location.hash, () => "");
  const route = useMemo(() => parse(hash), [hash]);
  const [st, setSt] = useState<Store>(emptyStore);
  const [state, setState] = useState<"busy" | "ok" | "err">("busy");
  const [toast, setToast] = useState("");
  const now = useRef(st);
  useEffect(() => { now.current = st; }, [st]);

  useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  const fail = useCallback((e: unknown) => {
    if (e instanceof LoginNeeded) { setSt(emptyStore()); return; } // the session is already cleared, so the login shows
    setState("err");
  }, []);

  const refresh = useCallback(async () => {
    setState("busy");
    try { const n = await pull(now.current); now.current = n; setSt(n); setState("ok"); } catch (e) { fail(e); }
  }, [fail]);

  useEffect(() => {
    if (!user) return;
    const k = setTimeout(refresh);
    const t = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60000);
    const v = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", v);
    return () => { clearTimeout(k); clearInterval(t); document.removeEventListener("visibilitychange", v); };
  }, [user, refresh]);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2200); };

  const act: Act = useMemo(() => ({
    person: async (id, p) => {
      const d = { ...p, upd: new Date().toISOString() };
      try { await save("crm_people", id, d); setSt((s) => ({ ...s, people: { ...s.people, [id]: d } })); say("ذخیره شد"); }
      catch (e) { fail(e); say("ذخیره نشد؛ اینترنت را ببین"); throw e; }
    },
    lead: async (l, id) => {
      const key = l ? l.id : id!;
      try {
        await save("crm_leads", key, l);
        setSt((s) => { const leads = { ...s.leads }; if (l) leads[key] = l; else delete leads[key]; return { ...s, leads }; });
        say(l ? "ذخیره شد" : "حذف شد");
      } catch (e) { fail(e); say("ذخیره نشد؛ اینترنت را ببین"); throw e; }
    },
  }), [fail]);

  const all: Client[] = useMemo(() => clients(st), [st]);

  if (user === undefined) return <div className="pn-boot" />;
  if (!user) return <Login onIn={() => setSt(emptyStore())} />;

  const first = state === "busy" && st.rev === 0;
  const fresh = Object.values(st.leads).filter((l) => l.status === "new").length;
  const tabs: [Route["page"], string, string][] = [["today", "امروز", "#/today"], ["clients", "مشتریان", "#/clients"], ["leads", "سفارش‌ها", "#/leads"], ["numbers", "اعداد", "#/numbers"]];
  const here = route.page === "client" ? "clients" : route.page;

  return (
    <div className="pn">
      <header className="pn-bar">
        <a className="pn-brand" href="#/today"><img src="/leaf.png" alt="" width={30} height={30} /><span className="leaf">لئون گلد</span><small>پنل مشتریان</small></a>
        <nav className="pn-tabs" aria-label="بخش‌ها">
          {tabs.map(([k, t, h]) => (
            <a key={k} href={h} aria-current={here === k ? "page" : undefined}>
              <Icon k={k} />{t}{k === "leads" && fresh > 0 && <b className="pn-dot">{fresh.toLocaleString("fa-IR")}</b>}
            </a>
          ))}
        </nav>
        <button className={"pn-sync " + state} onClick={refresh} aria-label="به‌روز کردن" title={state === "err" ? "به سرور وصل نشد" : "به‌روز کردن"}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" /></svg>
        </button>
        <button className="pn-out" onClick={async () => { await logout(); setSt(emptyStore()); }}>خروج</button>
      </header>
      {state === "err" && <p className="pn-banner" role="status">به سرور وصل نشد. آنچه می‌بینی آخرین نسخه‌ی گرفته‌شده است. <button onClick={refresh}>دوباره</button></p>}
      <main className="pn-main">
        {first ? <div className="pn-loading">در حال آوردن دفتر…</div>
          : route.page === "today" ? <Today st={st} all={all} />
          : route.page === "clients" ? <Clients all={all} />
          : route.page === "client" ? <ClientPage c={all.find((c) => c.party.id === route.id)} st={st} act={act} />
          : route.page === "numbers" ? <Numbers st={st} />
          : <Leads st={st} act={act} />}
      </main>
      {toast && <div className="pn-toast" role="status">{toast}</div>}
    </div>
  );
}

function Icon({ k }: { k: string }) {
  const d = k === "numbers" ? "M4 20h16M7 16v-5M12 16V6M17 16v-8" : k === "today" ? "M4 7h16M4 7v12h16V7M4 7l1-3h14l1 3M9 12h6" : k === "clients" ? "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 0 1 0 5.6M18 14.5c2.4.8 4 3 4 5.5" : "M6 3h12v18l-6-4-6 4zM9 8h6M9 12h4";
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

function Login({ onIn }: { onIn: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!u.trim() || !p) return setErr("نام کاربری و رمز را بنویس.");
    setBusy(true); setErr("");
    try { await login(u, p); onIn(); }
    catch (e) { setErr(e instanceof LoginNeeded ? "نام کاربری یا رمز درست نیست." : (e as Error).message === "too_many" ? "چند بار اشتباه شد؛ ربع ساعت دیگر دوباره امتحان کن." : "به سرور وصل نشد. اینترنت را ببین."); }
    setBusy(false);
  };
  return (
    <Door name="پنل مدیریت" latin="LEON GOLD · ADMIN" fine="فقط برای مدیر لئون گلد؛ این صفحه در جست‌وجو دیده نمی‌شود.">
      <form className="door-form" onSubmit={send} noValidate>
        <p className="door-note">با همان نام کاربری و رمزی وارد شو که «دفتر لئون» را با آن همگام کرده‌ای.</p>
        <label><span>نام کاربری</span><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" autoCapitalize="none" dir="ltr" /></label>
        <label><span>رمز</span><input value={p} onChange={(e) => setP(e.target.value)} type="password" autoComplete="current-password" dir="ltr" /></label>
        {err && <p className="pn-err" role="alert">{err}</p>}
        <button className="btn btn-gold" disabled={busy}>{busy ? "در حال ورود…" : "ورود"}</button>
      </form>
    </Door>
  );
}
