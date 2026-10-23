export default function Card({ children, title, subtitle, icon: Icon, highlight = false, className = '' }) {
  return (
    <section className={`glass p-6 animate-fade-up ${highlight ? 'glow' : ''} ${className}`}>
      {(title || Icon) && (
        <header className="mb-4 flex items-start gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white">
              <Icon size={20} />
            </span>
          )}
          <div>
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  )
}