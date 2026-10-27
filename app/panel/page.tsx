import type { Metadata } from "next";
import Panel from "@/components/panel/Panel";
import "./panel.css";

// The owner's CRM: private, behind the sync server's login, never indexed.
export const metadata: Metadata = {
  title: "پنل مشتریان · لئون گلد",
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return <Panel />;
}
