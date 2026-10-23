import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Boxes,
  Check,
  Crosshair,
  Database,
  GitBranch,
  Layers,
  Lightbulb,
  Mountain,
  Network,
  Orbit,
  Play,
  Settings2,
  Sigma,
  Split,
  Target,
  TrendingUp,
  Trees,
  Zap,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import PlotlyChart from '../components/charts/PlotlyChart'
import { detectProblem, fetchDatasetCharts } from '../api/client'
import { useAnalysis } from '../context/AnalysisContext'

// Chaque algorithme : clé backend, nom, description courte, icône et couleur
const ALGORITHMS = {
  classification: [
    {
      key: 'logistic_regression',
      label: 'Régression logistique',
      description: 'Modèle linéaire simple et rapide pour classer.',
      icon: Sigma,
      color: 'text-violet bg-violet/15',
    },
    {
      key: 'random_forest',
      label: 'Random Forest',
      description: "Ensemble d'arbres : robuste et souvent précis.",
      icon: Trees,
      color: 'text-emerald bg-emerald/15',
    },
    {
      key: 'decision_tree',
      label: 'Arbre de décision',
      description: 'Règles simples, faciles à lire et à expliquer.',
      icon: GitBranch,
      color: 'text-amber bg-amber/20',
    },
    {
      key: 'gradient_boosting',
      label: 'Gradient Boosting',
      description: 'Enchaîne des arbres pour corriger les erreurs précédentes.',
      icon: Zap,
      color: 'text-rose bg-rose/15',
    },
    {
      key: 'knn',
      label: 'K plus proches voisins',
      description: 'Classe un point selon ses voisins les plus proches.',
      icon: Crosshair,
      color: 'text-cyan bg-cyan/15',
    },
    {
      key: 'svm',
      label: 'SVM (noyau RBF)',
      description: 'Trace la frontière de séparation la plus nette possible.',
      icon: Split,
      color: 'text-violet bg-violet/15',
    },
  ],
  regression: [
    {
      key: 'linear_regression',
      label: 'Régression linéaire',
      description: 'Relation linéaire entre les variables, très rapide.',
      icon: TrendingUp,
      color: 'text-violet bg-violet/15',
    },
    {
      key: 'random_forest',
      label: 'Random Forest',
      description: "Ensemble d'arbres : robuste et souvent précis.",
      icon: Trees,
      color: 'text-emerald bg-emerald/15',
    },
    {
      key: 'decision_tree',
      label: 'Arbre de décision',
      description: 'Règles simples, faciles à lire et à expliquer.',
      icon: GitBranch,
      color: 'text-amber bg-amber/20',
    },
    {
      key: 'gradient_boosting',
      label: 'Gradient Boosting',
      description: 'Enchaîne des arbres pour corriger les erreurs précédentes.',
      icon: Zap,
      color: 'text-rose bg-rose/15',
    },
    {
      key: 'knn',
      label: 'K plus proches voisins',
      description: 'Prédit à partir de la moyenne des voisins les plus proches.',
      icon: Crosshair,
      color: 'text-cyan bg-cyan/15',
    },
    {
      key: 'svm',
      label: 'SVM (noyau RBF)',
      description: 'Régression à noyau, efficace sur des relations non linéaires.',
      icon: Split,
      color: 'text-violet bg-violet/15',
    },
  ],
  clustering: [
    {
      key: 'kmeans',
      label: 'K-Means',
      description: 'Regroupe les points autour de k centres.',
      icon: Boxes,
      color: 'text-violet bg-violet/15',
    },
    {
      key: 'agglomerative',
      label: 'Clustering hiérarchique',
      description: 'Fusionne pas à pas les groupes les plus proches.',
      icon: Network,
      color: 'text-cyan bg-cyan/15',
    },
    {
      key: 'dbscan',
      label: 'DBSCAN',
      description: 'Détecte les zones denses et isole le bruit.',
      icon: Orbit,
      color: 'text-amber bg-amber/20',
    },
    {
      key: 'meanshift',
      label: 'Mean Shift',
      description: 'Déplace les points vers les zones les plus denses, sans k fixé.',
      icon: Mountain,
      color: 'text-emerald bg-emerald/15',
    },
    {
      key: 'gmm',
      label: 'Mélange gaussien (GMM)',
      description: 'Clusters elliptiques avec appartenance souple aux groupes.',
      icon: Layers,
      color: 'text-rose bg-rose/15',
    },
  ],
}

const TYPE_LABELS = {
  classification: 'Classification',
  regression: 'Régression',
  clustering: 'Clustering',
}

const CHART_TABS = [
  { key: 'histograms', label: 'Histogrammes' },
  { key: 'correlation', label: 'Corrélations' },
  { key: 'missing_values', label: 'Valeurs manquantes' },
]

/** Carte cliquable pour un algorithme, avec son icône et son état coché. */
function AlgorithmCard({ label, description, icon: Icon, color, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`group relative flex cursor-pointer flex-col items-start gap-3 rounded-2xl border-[1.5px] p-5 text-left transition hover:-translate-y-0.5
        ${
          checked
            ? 'border-ink bg-cyan/10 shadow-[4px_4px_0_0_#1f1d2b]'
            : 'border-line bg-white hover:border-ink/40'
        }`}
    >
      {checked && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-white">
          <Check size={14} strokeWidth={3} />
        </span>
      )}

      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
        <Icon size={24} />
      </span>

      <div>
        <p className="font-bold text-ink">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </button>
  )
}

export default function Configure() {
  const navigate = useNavigate()
  const { dataset, config, updateConfig, launchAnalysis, isRunning, error } = useAnalysis()

  const [detection, setDetection] = useState(null)
  const [detectError, setDetectError] = useState(null)
  const [charts, setCharts] = useState(null)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [chartTab, setChartTab] = useState('histograms')

  const datasetId = dataset?.dataset_id

  // Graphiques d'exploration (une seule fois par dataset)
  useEffect(() => {
    if (!datasetId) return
    let cancelled = false
    fetchDatasetCharts(datasetId)
      .then((data) => !cancelled && setCharts(data))
      .catch(() => !cancelled && setCharts(null))
      .finally(() => !cancelled && setChartsLoading(false))
    return () => {
      cancelled = true
    }
  }, [datasetId])

  // Détection du type de problème à chaque changement de cible ou de type forcé
  useEffect(() => {
    if (!datasetId) return
    let cancelled = false
    detectProblem(datasetId, config.target, config.problemType)
      .then((data) => {
        if (cancelled) return
        setDetection(data)
        setDetectError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setDetection(null)
        setDetectError(err.response?.data?.detail || 'Détection impossible.')
      })
    return () => {
      cancelled = true
    }
  }, [datasetId, config.target, config.problemType])

  if (!dataset) return <Navigate to="/" replace />

  const { preview } = dataset
  const columnNames = preview.columns.map((col) => col.name)
  const problemType = detection?.problem_type
  const algorithms = problemType ? ALGORITHMS[problemType] : []

  function handleTargetChange(event) {
    // Changer de cible remet les choix dépendants à zéro
    updateConfig({ target: event.target.value, problemType: null, algorithms: [], nClusters: null })
  }

  function handleTypeChange(type) {
    updateConfig({ problemType: type, algorithms: [] })
  }

  function toggleAlgorithm(key) {
    const current = config.algorithms
    updateConfig({
      algorithms: current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    })
  }

  async function handleLaunch() {
    const ok = await launchAnalysis()
    if (ok) navigate('/resultats')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Configurez votre <span className="text-gradient">analyse</span>
        </h1>
        <p className="mt-2 text-muted">
          Explorez votre dataset, puis choisissez la colonne à prédire (ou aucune pour du clustering).
        </p>
      </div>

      {/* Résumé du dataset */}
      <Card title={dataset.filename} subtitle="Dataset chargé" icon={Database}>
        <div className="mb-5 flex flex-wrap gap-2">
          <Badge tone="violet">{preview.rows} lignes</Badge>
          <Badge tone="cyan">{preview.columns_count} colonnes</Badge>
          <Badge tone="neutral">
            {preview.columns.reduce((sum, col) => sum + col.missing, 0)} valeurs manquantes
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                {columnNames.map((name) => (
                  <th key={name} className="whitespace-nowrap px-3 py-2 font-medium">
                    {name}
                    <span className="ml-1.5 text-xs opacity-60">
                      {preview.columns.find((c) => c.name === name)?.is_numeric ? '#' : 'abc'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.sample.map((row, index) => (
                <tr key={index} className="border-t border-line">
                  {columnNames.map((name) => (
                    <td key={name} className="max-w-[180px] truncate whitespace-nowrap px-3 py-2">
                      {row[name] === null || row[name] === undefined ? (
                        <span className="text-rose">—</span>
                      ) : (
                        String(row[name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Aperçu des {preview.sample.length} premières lignes.</p>
      </Card>

      {/* Exploration */}
      <Card title="Exploration" subtitle="Distribution et qualité des données" icon={BarChart3}>
        <div className="mb-4 flex flex-wrap gap-2">
          {CHART_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setChartTab(tab.key)}
              className={`cursor-pointer rounded-xl border-[1.5px] px-3.5 py-1.5 text-sm font-semibold transition
                ${
                  chartTab === tab.key
                    ? 'border-ink bg-violet text-white shadow-[2px_2px_0_0_#1f1d2b]'
                    : 'border-line bg-surface-2 text-muted hover:text-ink'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {chartsLoading && (
          <div className="flex items-center gap-2 py-10 text-muted">
            <Spinner /> Génération des graphiques…
          </div>
        )}

        {!chartsLoading && !charts && (
          <p className="py-6 text-sm text-muted">Les graphiques d'exploration sont indisponibles.</p>
        )}

        {!chartsLoading && charts && chartTab === 'histograms' && (
          charts.histograms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {charts.histograms.map((item) => (
                <PlotlyChart key={item.column} figure={item.figure} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-sm text-muted">Aucune colonne numérique à afficher.</p>
          )
        )}

        {!chartsLoading && charts && chartTab === 'correlation' && (
          charts.correlation ? (
            <PlotlyChart figure={charts.correlation} />
          ) : (
            <p className="py-6 text-sm text-muted">Il faut au moins 2 colonnes numériques.</p>
          )
        )}

        {!chartsLoading && charts && chartTab === 'missing_values' && (
          charts.missing_values ? (
            <PlotlyChart figure={charts.missing_values} />
          ) : (
            <p className="py-6 text-sm font-medium text-emerald">
              Aucune valeur manquante dans ce dataset.
            </p>
          )
        )}
      </Card>

      {/* Colonne cible et détection */}
      <Card
        title="Objectif de l'analyse"
        subtitle="Avez-vous une colonne à prédire ?"
        icon={Target}
        highlight
      >
        <label htmlFor="target" className="mb-1.5 block text-sm font-semibold text-ink">
          Colonne cible
        </label>
        <select
          id="target"
          value={config.target}
          onChange={handleTargetChange}
          className="w-full cursor-pointer rounded-xl border-[1.5px] border-ink/30 bg-surface-2 px-4 py-3 text-ink outline-none transition focus:border-ink"
        >
          <option value="">Aucune (analyse non supervisée : clustering)</option>
          {columnNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {detectError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border-[1.5px] border-rose bg-rose/10 p-3 text-sm font-medium text-rose">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{detectError}</span>
          </div>
        )}

        {detection && !detectError && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border-[1.5px] border-cyan bg-cyan/10 p-4">
              <Lightbulb size={20} className="mt-0.5 shrink-0 text-cyan" />
              <div>
                <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                  Type détecté
                  <Badge tone="violet">{TYPE_LABELS[detection.problem_type]}</Badge>
                  <Badge tone="neutral">
                    {detection.learning_type === 'supervised' ? 'Supervisé' : 'Non supervisé'}
                  </Badge>
                </p>
                <p className="text-sm text-muted">{detection.reason}</p>
              </div>
            </div>

            {detection.warnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-2 rounded-xl border-[1.5px] border-amber bg-amber/10 p-3 text-sm font-medium text-ink"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber" />
                <span>{warning}</span>
              </div>
            ))}

            {/* Correction manuelle du type (uniquement si une cible est choisie) */}
            {config.target && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted">Ce n'est pas le bon type ? Corrigez-le :</p>
                <div className="flex gap-2">
                  {['classification', 'regression'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={`cursor-pointer rounded-xl border-[1.5px] px-4 py-2 text-sm font-semibold transition
                        ${
                          problemType === type
                            ? 'border-ink bg-violet/15 text-ink shadow-[2px_2px_0_0_#1f1d2b]'
                            : 'border-line bg-surface-2 text-muted hover:text-ink'
                        }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Algorithmes : une carte par algorithme */}
      {detection && !detectError && (
        <Card title="Algorithmes" subtitle="Facultatif : aucun coché = tous les algorithmes" icon={Settings2}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {algorithms.map(({ key, label, description, icon, color }) => (
              <AlgorithmCard
                key={key}
                label={label}
                description={description}
                icon={icon}
                color={color}
                checked={config.algorithms.includes(key)}
                onToggle={() => toggleAlgorithm(key)}
              />
            ))}
          </div>

          {problemType === 'clustering' && (
            <div className="mt-6">
              <label htmlFor="k" className="mb-1.5 block text-sm font-semibold text-ink">
                Nombre de clusters (vide = choix automatique)
              </label>
              <input
                id="k"
                type="number"
                min={2}
                max={20}
                placeholder="Automatique"
                value={config.nClusters ?? ''}
                onChange={(e) =>
                  updateConfig({ nClusters: e.target.value ? Number(e.target.value) : null })
                }
                className="w-40 rounded-xl border-[1.5px] border-ink/30 bg-surface-2 px-4 py-2.5 text-ink outline-none transition focus:border-ink"
              />
              <p className="mt-2 text-xs text-muted">
                Utilisé par K-Means, le clustering hiérarchique et le GMM. Mean Shift et DBSCAN choisissent eux-mêmes.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Erreur de lancement */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border-[1.5px] border-rose bg-rose/10 p-3 text-sm font-medium text-rose">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lancement */}
      <button
        type="button"
        onClick={handleLaunch}
        disabled={!detection || Boolean(detectError) || isRunning}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink bg-violet px-6 py-4 text-base font-bold text-white shadow-[4px_4px_0_0_#1f1d2b] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none disabled:hover:translate-y-0"
      >
        {isRunning ? 'Entraînement des modèles en cours…' : "Lancer l'analyse"}
        {!isRunning && <Play size={18} />}
      </button>
    </div>
  )
}