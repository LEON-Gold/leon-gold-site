// Leon's loading mark (lib/loader.js): the gold leaf drawing itself in a turning guilloché ring, with what is loading under it
import { LOADER_SVG } from "@/lib/loader";

export default function Loader({ label }: { label: string }) {
  return (
    <div className="lg-ld-w" role="status" aria-live="polite">
      <span dangerouslySetInnerHTML={{ __html: LOADER_SVG }} />
      <span className="lg-ld-t">{label}</span>
    </div>
  );
}
