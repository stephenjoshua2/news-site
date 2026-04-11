export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="page-stack">
      <section className="state-panel state-panel-loading">
        <div className="state-panel-copy">
          <span className="eyebrow">Loading</span>
          <h1 className="section-title">Loading newsroom content</h1>
          <p>Preparing stories, editorial tools, and reader discussion.</p>
        </div>
        <div aria-hidden="true" className="skeleton-stack">
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line-medium" />
          <span className="skeleton-line skeleton-line-short" />
        </div>
      </section>

      <div aria-hidden="true" className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </div>
  );
}
