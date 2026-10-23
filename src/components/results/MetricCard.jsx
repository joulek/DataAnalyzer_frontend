function formatValue(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value !== 'number') return String(value)
  if (Number.isInteger(value)) return String(value)
  return Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(3)
}

export default function MetricCard({ label, value, hint, highlight = false }) {
  return (
    <div
      className={`glass p-4 ${highlight ? 'border-emerald/40 shadow-[0_0_24px_-8px_rgba(16,185,129,0.5)]' : ''}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-emerald' : 'text-ink'}`}>
        {formatValue(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}