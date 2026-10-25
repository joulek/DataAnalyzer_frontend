import { Code2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row">
        <p>
          © 2025 
          <span className="font-display font-semibold text-ink">
            Data<span className="text-gradient">Analyzer</span>
          </span>{' '}
          · Projet académique
        </p>
        <p className="flex items-center gap-2">
          <Code2 size={14} />
          React · FastAPI · scikit-learn · Plotly
        </p>
      </div>
    </footer>
  )
}