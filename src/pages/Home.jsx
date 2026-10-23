import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Database,
  FileSpreadsheet,
  FileText,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { getErrorMessage, uploadDataset } from '../api/client'
import { useAnalysis } from '../context/AnalysisContext'

const MAX_SIZE_MB = 20

const FORMATS = [
  { label: 'CSV', icon: FileText },
  { label: 'Excel (.xlsx)', icon: FileSpreadsheet },
]

const STEPS = [
  {
    icon: Database,
    title: 'Déposez vos données',
    text: "Un fichier CSV ou Excel, jusqu'à 20 Mo.",
    tile: 'bg-violet/15 text-violet',
    card: 'bg-white',
    rotate: '-rotate-1',
  },
  {
    icon: BrainCircuit,
    title: 'Choisissez la cible',
    text: 'Sélectionnez la colonne à prédire, ou aucune pour du clustering.',
    tile: 'bg-cyan/15 text-cyan',
    card: 'bg-white',
    rotate: 'md:translate-y-6',
  },
  {
    icon: BarChart3,
    title: 'Comparez les modèles',
    text: 'Métriques, matrices de confusion et graphiques, en quelques secondes.',
    tile: 'bg-amber/20 text-amber',
    card: 'bg-white',
    rotate: 'rotate-1',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { setDataset } = useAnalysis()

  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const onDrop = useCallback((accepted, rejected) => {
    setError(null)
    if (rejected.length > 0) {
      const code = rejected[0].errors[0]?.code
      setError(
        code === 'file-too-large'
          ? `Fichier trop volumineux (maximum ${MAX_SIZE_MB} Mo).`
          : 'Format non supporté. Utilisez un fichier .csv ou .xlsx.'
      )
      return
    }
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    disabled: uploading,
  })

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError(null)
    try {
      const data = await uploadDataset(file, setProgress)
      setDataset(data)
      navigate('/configuration')
    } catch (err) {
      setError(getErrorMessage(err))
      setUploading(false)
    }
  }

  const sizeLabel = file ? `${(file.size / (1024 * 1024)).toFixed(2)} Mo` : ''

  return (
    <div className="relative isolate overflow-hidden">
      {/* Formes décoratives unies */}
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-72 w-72 rounded-[40%_60%_55%_45%] bg-violet/15" />
      <div className="pointer-events-none absolute -right-20 top-72 -z-10 h-64 w-64 rounded-full bg-cyan/15" />
      <div className="pointer-events-none absolute left-1/3 top-[38rem] -z-10 h-20 w-20 rotate-12 rounded-2xl bg-amber/40" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        {/* En-tête */}
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber/25 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-ink">
            <Sparkles size={14} className="text-violet" />
            Transformez vos données
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
            Importez votre dataset,
            <br />
            on s'occupe du <span className="text-gradient">reste</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg">
            Analysez, visualisez et découvrez les informations utiles de vos données grâce au
            machine learning, sans écrire une ligne de code.
          </p>
        </div>

        {/* Zone d'upload */}
        <div className="relative mx-auto mt-12 max-w-2xl animate-fade-up">
          {/* Icônes flottantes (grand écran) */}
          <div className="pointer-events-none absolute -left-16 top-12 hidden animate-float rounded-2xl border-[1.5px] border-ink bg-white p-3 shadow-[3px_3px_0_0_#1f1d2b] lg:block">
            <FileSpreadsheet className="text-emerald" size={26} />
          </div>
          <div
            className="pointer-events-none absolute -right-14 top-40 hidden animate-float rounded-2xl border-[1.5px] border-ink bg-white p-3 shadow-[3px_3px_0_0_#1f1d2b] lg:block"
            style={{ animationDelay: '1.5s' }}
          >
            <BarChart3 className="text-violet" size={26} />
          </div>

          <div className="glass relative p-4 sm:p-5">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition
                ${
                  isDragActive
                    ? 'border-violet bg-violet/10'
                    : 'border-ink/25 bg-surface-2/50'
                }
                ${uploading ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input {...getInputProps()} />

              {file ? (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan text-white shadow-[4px_4px_0_0_#1f1d2b]">
                    <FileSpreadsheet size={34} />
                  </span>
                  <p className="mt-5 max-w-full truncate text-lg font-bold text-ink">{file.name}</p>
                  <p className="text-sm text-muted">{sizeLabel}</p>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={open}
                      className="mt-3 cursor-pointer text-sm font-semibold text-violet underline-offset-4 hover:underline"
                    >
                      Choisir un autre fichier
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet/15 text-violet">
                    <UploadCloud size={36} />
                  </span>
                  <p className="mt-5 text-lg font-bold text-ink">
                    {isDragActive ? 'Déposez le fichier ici !' : 'Glissez-déposez votre fichier'}
                  </p>
                  <p className="text-sm text-muted">ou cliquez sur le bouton ci-dessous</p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {FORMATS.map(({ label, icon: Icon }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-line"
                      >
                        <Icon size={13} /> {label}
                      </span>
                    ))}
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-line">
                      Max {MAX_SIZE_MB} Mo
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={open}
                    className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-ink bg-violet px-6 py-3 text-sm font-bold text-white shadow-[3px_3px_0_0_#1f1d2b] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_0_#1f1d2b] active:translate-y-0 active:shadow-none"
                  >
                    <FileSpreadsheet size={18} /> Choisir un fichier
                  </button>
                </>
              )}
            </div>

            {/* Progression */}
            {uploading && (
              <div className="mt-5 px-1">
                <div className="h-3 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                  <div
                    className="h-full rounded-full bg-violet transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs font-medium text-muted">
                  {progress < 100 ? `Envoi en cours… ${progress} %` : 'Analyse du fichier…'}
                </p>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border-[1.5px] border-rose bg-rose/10 p-3 text-sm font-medium text-rose">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink bg-ink px-6 py-4 text-base font-bold text-white shadow-[4px_4px_0_0_#ff5a36] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none disabled:hover:translate-y-0"
            >
              {uploading ? 'Envoi en cours…' : 'Analyser ce dataset'}
              {!uploading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>

        {/* Étapes */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text, tile, card, rotate }, index) => (
            <div
              key={title}
              className={`glass ${card} ${rotate} p-6 transition hover:-translate-y-1 hover:rotate-0`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tile}`}>
                  <Icon size={22} />
                </span>
                <span className="font-display text-3xl font-bold text-ink/15">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-20 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <Sparkles size={16} className="text-amber" />
          Modèles entraînés automatiquement, métriques comparées, meilleur modèle mis en avant.
        </p>
      </div>
    </div>
  )
}