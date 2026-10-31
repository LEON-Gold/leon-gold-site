// A small ivory appraisal tag, Spade-style but in Leon's own colours: gold hairline, small corner ticks, a dashed
// receipt rule under the heading. Used beside the hero jewel (lib/content.ts's purity line, not one product) and
// on each vitrin/<slug> page (the piece's own real rows from lib/products.ts).
export function AssaySlip({ title, rows }: { title: string; rows: [string, string, boolean?][] }) {
  return (
    <div className="slip">
      <i className="slip-tick c1" aria-hidden /><i className="slip-tick c2" aria-hidden />
      <i className="slip-tick c3" aria-hidden /><i className="slip-tick c4" aria-hidden />
      <p className="slip-h"><span lang="en" dir="ltr">ASSAY</span><span>{title}</span></p>
      <dl className="slip-rows">
        {rows.map(([k, v, soon]) => (
          <div className="slip-row" key={k}><dt>{k}</dt><dd className={soon ? "soon" : undefined}>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
