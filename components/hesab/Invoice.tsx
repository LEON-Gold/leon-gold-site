"use client";
// One invoice in «حساب من», on the ledger's own A4 sheet: the ledger app opens in its «#view» mode (leon-gold/index.html
// viewMode()) and this page hands it the saved invoice the server sent (leon-gold-server/portal.mjs sheetOf). So the party
// sees exactly the owner's invoice, with the ledger's own sums, terms and «ذخیره PDF». The ledger reads and writes no data there.
// Same origin only (the ledger sits beside the site: /leon-gold-app/ on the preview, /daftar/ on the domain). Worked out from the
// address in the browser, since lib/content.ts LEDGER reads PREVIEW_BASE, which only exists while the pages are built.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { faDigits, type Entry } from "@/lib/hesab";

const ledgerUrl = () => { const m = /^(.*\/)site\//.exec(location.pathname); return (m ? m[1] : "/daftar/") + "#view"; };

export function LedgerInvoice({ e, onClose, onFail }: { e: Entry; onClose: () => void; onFail: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    document.body.classList.add("hs-sheet-open");
    const k = (x: KeyboardEvent) => { if (x.key === "Escape") onClose(); };
    const m = (x: MessageEvent) => {
      if (x.origin !== location.origin || x.source !== frame.current?.contentWindow || !x.data?.leonView) return;
      if (x.data.leonView === "ready") frame.current?.contentWindow?.postMessage({ leonInv: e.sheet }, location.origin);
      else if (x.data.leonView === "shown") setShown(true);
      else if (x.data.leonView === "close") onClose();
      else if (x.data.leonView === "error") onFail();
    };
    // a ledger that never answers (an old copy, no network): the simple invoice instead
    let ok = false; const mark = (x: MessageEvent) => { if (x.data?.leonView === "shown") ok = true; };
    const t = setTimeout(() => { if (!ok) onFail(); }, 20000);
    addEventListener("keydown", k); addEventListener("message", m); addEventListener("message", mark);
    return () => { clearTimeout(t); removeEventListener("keydown", k); removeEventListener("message", m); removeEventListener("message", mark); document.body.classList.remove("hs-sheet-open"); };
  }, [e, onClose, onFail]);
  return createPortal(
    <div className="hs-ledger-inv" role="dialog" aria-modal="true" aria-label={faDigits(e.label)}>
      {!shown && <p className="hs-ledger-wait" aria-live="polite">در حال باز کردن فاکتور…</p>}
      <iframe ref={frame} src={ledgerUrl()} title={faDigits(e.label)} style={{ opacity: shown ? 1 : 0 }} />
      {!shown && <button type="button" className="hs-link hs-ledger-x" onClick={onClose}>بستن</button>}
    </div>, document.body);
}
