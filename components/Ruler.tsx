// A fine gold tick mark down each margin, like a measuring guide on the page. Decoration only, within the
// section gutter (var(--m)) so it never crosses text.
export default function Ruler() {
  return <><i className="ruler l" aria-hidden /><i className="ruler r" aria-hidden /></>;
}
