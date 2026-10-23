import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Download,
  FileCode,
  Gauge,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PlotlyChart from '../components/charts/PlotlyChart'
import MetricCard from '../components/results/MetricCard'
import ModelTabs from '../components/results/ModelTabs'
import { downloadNotebook, downloadReport } from '../api/client'
import { useAnalysis } from '../context/AnalysisContext'

const TYPE_LABELS = {
  classification: 'Classification',
  regression: 'Régression',
  clustering: 'Clustering',
}

const SCORE_METRIC_LABEL = {
  classification: 'F1-score pondéré',
  regression: 'R² (ramené à 0 s\'il est négatif)',
  clustering: 'Silhouette (ramenée à 0 si négative)',
}

const METRIC_LABELS = {
  accuracy: 'Accuracy',
  balanced_accuracy: 'Accuracy équilibrée',
  precision_weighted: 'Precision',
  recall_weighted: 'Recall',
  f1_weighted: 'F1-score',
  precision_macro: 'Precision (macro)',
  recall_macro: 'Recall (macro)',
  f1_macro: 'F1-score (macro)',
  cohen_kappa: 'Kappa de Cohen',
  mcc: 'MCC',
  roc_auc: 'AUC ROC',
  r2: 'R²',
  mae: 'MAE',
  mse: 'MSE',
  rmse: 'RMSE',
  explained_variance: 'Variance expliquée',
  median_ae: 'Erreur médiane',
  mape: 'MAPE (%)',
  silhouette: 'Silhouette',
  davies_bouldin: 'Davies-Bouldin',
  calinski_harabasz: 'Calinski-Harabasz',
  n_clusters: 'Clusters',
  n_noise: 'Points de bruit',
}

// Courte aide affichée sous les métriques moins connues
const METRIC_HINTS = {
  cohen_kappa: 'Accord au-delà du hasard (1 = parfait, 0 = hasard).',
  mcc: 'Corrélation entre réel et prédit, fiable même si les classes sont déséquilibrées.',
  roc_auc: 'Capacité à séparer les classes (1 = parfait, 0.5 = hasard).',
  explained_variance: 'Part de la variance de la cible expliquée par le modèle.',
  median_ae: 'Erreur médiane : moins sensible aux valeurs extrêmes que la MAE.',
  mape: 'Erreur relative moyenne en pourcentage de la valeur réelle.',
}

const CHART_LABELS = {
  feature_importance: 'Importance des variables',
  confusion_matrix: 'Matrice de confusion',
  per_class: 'Métriques par classe',
  roc: 'Courbe ROC',
  actual_vs_predicted: 'Valeurs réelles vs prédites',
  residuals: 'Résidus',
  scatter: 'Clusters (projection PCA)',
  cluster_sizes: 'Taille des clusters',
  elbow: 'Méthode du coude',
  silhouette: 'Silhouette selon k',
  metrics: 'Comparaison des modèles',
  r2: 'Comparaison des modèles : R²',
  errors: 'Comparaison des modèles : erreurs',
  mape: 'Comparaison des modèles : MAPE (%)',
}

function labelFor(key) {
  return METRIC_LABELS[key] ?? key.replace(/_/g, ' ')
}

// Seules les métriques scalaires s'affichent (les listes et matrices sont ignorées)
function scalarMetrics(metrics = {}) {
  return Object.entries(metrics).filter(
    ([, v]) => v === null || typeof v === 'number' || typeof v === 'string'
  )
}

/**
 * Transforme la réponse de /api/analyze en structure utilisable par la page.
 * Accepte la réponse complète ({ results, charts, ... }) ou seulement "results".
 */
function buildView(response) {
  if (!response) return null

  const analysis = response.results ?? response
  const charts = response.charts ?? {}
  const models = Array.isArray(analysis.models) ? analysis.models : []

  // Graphiques partagés par tous les modèles (comparaisons, choix de k)
  const sharedCharts = [
    ...Object.entries(charts.comparison ?? {}).map(([k, fig]) => ({
      title: CHART_LABELS[k] ?? k,
      figure: fig,
    })),
    ...Object.entries(charts.k_selection ?? {}).map(([k, fig]) => ({
      title: CHART_LABELS[k] ?? k,
      figure: fig,
    })),
  ].filter((c) => c.figure)

  return {
    problemType: analysis.problem_type,
    bestKey: analysis.best_model,
    bestScore: analysis.best_score ?? null,
    failedModels: Array.isArray(analysis.failed_models) ? analysis.failed_models : [],
    models: models.map((m) => ({
      ...m,
      key: m.key ?? m.name,
      label: m.name,
      score: m.score ?? null,
    })),
    modelCharts: (key) =>
      Object.entries(charts.models?.[key] ?? {})
        .filter(([, fig]) => fig)
        .map(([name, fig]) => ({ title: CHART_LABELS[name] ?? name, figure: fig })),
    sharedCharts,
  }
}

/** Barre de score de 0 à 100 %. */
function ScoreBar({ score }) {
  if (score === null || score === undefined) {
    return <p className="text-sm text-muted">Score indisponible pour ce modèle.</p>
  }

  const value = Math.min(100, Math.max(0, score))

  return (
    <div>
      <div className="flex items-end gap-1">
        <span className="text-5xl font-bold text-ink">{value.toFixed(1)}</span>
        <span className="pb-1.5 text-xl font-bold text-muted">%</span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
        <div
          className="h-full rounded-full bg-violet transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  // Le contexte expose la réponse sous le nom "analysis"
  const { analysis: results, dataset, reset } = useAnalysis()
  const [activeKey, setActiveKey] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  const view = buildView(results)

  // Aucun résultat (page rechargée ou accès direct) : retour à l'accueil
  if (!view || view.models.length === 0) return <Navigate to="/" replace />

  const { models, bestKey, bestScore, problemType, sharedCharts, failedModels } = view
  const currentKey = activeKey ?? bestKey ?? models[0].key
  const current = models.find((m) => m.key === currentKey) ?? models[0]
  const isBest = current.key === bestKey
  const metrics = scalarMetrics(current.metrics)
  const charts = [...view.modelCharts(current.key), ...sharedCharts]

  async function handleDownload() {
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadReport(dataset?.dataset_id, dataset?.filename, results)
    } catch {
      setDownloadError('Impossible de générer le rapport PDF.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleNotebook() {
    setExporting(true)
    setDownloadError(null)
    try {
      await downloadNotebook(dataset?.dataset_id, dataset?.filename, results)
    } catch {
      setDownloadError('Impossible de générer le notebook.')
    } finally {
      setExporting(false)
    }
  }

  function handleRestart() {
    if (typeof reset === 'function') reset()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Résultats de l'<span className="text-gradient">analyse</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {problemType && (
              <Badge tone="violet">{TYPE_LABELS[problemType] ?? problemType}</Badge>
            )}
            <Badge tone="neutral">{models.length} modèle(s) comparé(s)</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/configuration')}>
            <ArrowLeft size={16} /> Reconfigurer
          </Button>
          <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Génération…' : 'Télécharger le PDF'}
          </Button>
          <Button variant="secondary" onClick={handleNotebook} disabled={exporting}>
            <FileCode size={16} /> {exporting ? 'Génération…' : 'Exporter le notebook'}
          </Button>
          <Button onClick={handleRestart}>
            <RotateCcw size={16} /> Nouveau dataset
          </Button>
        </div>
      </div>

      {downloadError && (
        <div className="rounded-xl border-[1.5px] border-rose bg-rose/10 p-3 text-sm font-medium text-rose">
          {downloadError}
        </div>
      )}

      <Card title="Modèles" subtitle="Le trophée indique le meilleur modèle" icon={Trophy}>
        <ModelTabs
          models={models}
          activeKey={current.key}
          bestKey={bestKey}
          onChange={setActiveKey}
        />
      </Card>

      {failedModels.length > 0 && (
        <Card title="Modèles non entraînés" subtitle="Ces algorithmes n'ont pas pu être appliqués" icon={AlertTriangle}>
          <ul className="space-y-2">
            {failedModels.map((item, index) => (
              <li
                key={`${item.model}-${index}`}
                className="rounded-xl border-[1.5px] border-amber bg-amber/10 p-3 text-sm font-medium text-ink"
              >
                <span className="font-bold">{item.model}</span> : {item.error}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Score"
        subtitle={
          problemType
            ? `Basé sur le ${SCORE_METRIC_LABEL[problemType]}`
            : 'Score de performance'
        }
        icon={Award}
        highlight={isBest}
      >
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <ScoreBar score={current.score} />
          <div className="rounded-xl border-[1.5px] border-ink bg-surface-2 px-5 py-4 md:min-w-56">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Meilleur score</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {bestScore !== null ? `${Number(bestScore).toFixed(1)} %` : '—'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {models.find((m) => m.key === bestKey)?.label ?? ''}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title={current.label}
        subtitle={isBest ? 'Meilleur modèle' : 'Métriques du modèle'}
        icon={Gauge}
        highlight={isBest}
      >
        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {metrics.map(([key, value]) => (
              <MetricCard
                key={key}
                label={labelFor(key)}
                value={value}
                hint={METRIC_HINTS[key]}
                highlight={isBest}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune métrique disponible pour ce modèle.</p>
        )}
      </Card>

      <Card title="Graphiques" subtitle="Visualisation des performances" icon={BarChart3}>
        {charts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {charts.map((item, index) => (
              <div key={`${item.title}-${index}`}>
                <p className="mb-2 text-sm font-medium text-muted">{item.title}</p>
                <PlotlyChart figure={item.figure} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucun graphique disponible pour ce modèle.</p>
        )}
      </Card>
    </div>
  )
}