"use client";
// Dark / light (owner, 2026-11-09). The page starts in the visitor's last choice, else the phone's own setting (the
// script in app/layout.tsx sets html[data-theme] before the first paint); this button switches and remembers it.
import { useEffect, useState } from "react";

const KEY = "leon-theme";
const SUN = <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>;
const MOON = <svg viewBox="0 0 24 24" aria-hidden><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" /></svg>;

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  const flip = () => {
    const next = !(document.documentElement.dataset.theme === "dark");
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem(KEY, next ? "dark" : "light"); } catch {}
    setDark(next);
  };
  return (
    <button type="button" className={"theme-t " + className} onClick={flip} aria-label={dark ? "حالت روشن" : "حالت تاریک"} title={dark ? "حالت روشن" : "حالت تاریک"}>
      {dark ? SUN : MOON}
    </button>
  );
}

// before the first paint: the saved choice, else the device's
export const THEME_BOOT = `try{var t=localStorage.getItem("${KEY}");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
