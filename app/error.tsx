'use client';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fatalShell">
      <section className="fatalCard">
        <div className="brandMark">F</div>
        <p className="eyebrow">FALCON PBL MONITOR</p>
        <h1>Unable to load live data</h1>
        <p>The monitor could not read the configured database. The operational PBL portal and its data have not been modified.</p>
        <div className="fatalError">{error.message || 'Database read failed.'}</div>
        <button className="primaryButton" onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
