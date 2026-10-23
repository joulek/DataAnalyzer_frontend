const TONES = {
  violet: 'bg-violet/15 text-violet border-violet/30',
  cyan: 'bg-cyan/15 text-cyan border-cyan/30',
  emerald: 'bg-emerald/15 text-emerald border-emerald/30',
  amber: 'bg-amber/15 text-amber border-amber/30',
  rose: 'bg-rose/15 text-rose border-rose/30',
  neutral: 'bg-surface-2 text-muted border-line',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium
        ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}