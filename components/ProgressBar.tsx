export default function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progressWrap" aria-label={label ?? `${pct}%`}>
      <div className="progressTrack"><span style={{ width: `${pct}%` }} /></div>
      <span className="progressText">{pct}%</span>
    </div>
  );
}
