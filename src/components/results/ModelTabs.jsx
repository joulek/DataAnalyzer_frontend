import { Trophy } from 'lucide-react'

export default function ModelTabs({ models, activeKey, bestKey, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {models.map((model) => {
        const key = model.key ?? model.name
        const active = key === activeKey
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition
              ${active ? 'bg-gradient-brand text-white' : 'bg-surface-2 text-muted hover:text-ink'}`}
          >
            {key === bestKey && <Trophy size={14} className={active ? 'text-white' : 'text-emerald'} />}
            {model.label ?? model.name}
          </button>
        )
      })}
    </div>
  )
}