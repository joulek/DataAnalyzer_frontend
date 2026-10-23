import { Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Check, RotateCcw, Settings2, Upload } from 'lucide-react'
import { useAnalysis } from '../../context/AnalysisContext'

const STEPS = [
  { path: '/', label: 'Upload', icon: Upload },
  { path: '/configuration', label: 'Configuration', icon: Settings2 },
  { path: '/resultats', label: 'Résultats', icon: BarChart3 },
]

export default function Navbar() {
  const { dataset, analysis, reset } = useAnalysis()
  const { pathname } = useLocation()

  // Une étape est accessible seulement si les données nécessaires existent
  const isEnabled = (path) => {
    if (path === '/') return true
    if (path === '/configuration') return Boolean(dataset)
    return Boolean(analysis)
  }

  const currentIndex = STEPS.findIndex((step) => step.path === pathname)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-night/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg shadow-violet/30">
            <BarChart3 size={20} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Data<span className="text-gradient">Analyzer</span>
          </span>
        </Link>

        {/* Étapes */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Étapes">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const enabled = isEnabled(step.path)
            const done = index < currentIndex
            const active = index === currentIndex

            const content = (
              <>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                    ${active ? 'bg-gradient-brand text-white' : ''}
                    ${done ? 'bg-emerald/20 text-emerald' : ''}
                    ${!active && !done ? 'bg-surface-2 text-muted' : ''}`}
                >
                  {done ? <Check size={14} /> : <Icon size={14} />}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </>
            )

            const classes = `flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium transition
              ${active ? 'bg-surface-2 text-ink' : 'text-muted'}
              ${enabled ? 'hover:text-ink' : 'cursor-not-allowed opacity-40'}`

            return (
              <div key={step.path} className="flex items-center gap-1 sm:gap-2">
                {enabled ? (
                  <NavLink to={step.path} className={classes}>
                    {content}
                  </NavLink>
                ) : (
                  <span className={classes} aria-disabled="true">
                    {content}
                  </span>
                )}
                {index < STEPS.length - 1 && <span className="h-px w-3 bg-line sm:w-6" />}
              </div>
            )
          })}
        </nav>

        {/* Nouvelle analyse */}
        <div className="w-[120px] text-right">
          {dataset && (
            <button
              onClick={reset}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-ink"
              title="Recommencer avec un nouveau dataset"
            >
              <RotateCcw size={14} />
              <span className="hidden md:inline">Nouveau</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}