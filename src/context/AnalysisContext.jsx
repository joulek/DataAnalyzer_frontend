import { createContext, useContext, useState } from 'react'
import { getErrorMessage, runAnalysis } from '../api/client'

const AnalysisContext = createContext(null)

const STORAGE_KEY = 'dataanalyzer_dataset'

const DEFAULT_CONFIG = {
  target: '', // vide = pas de colonne cible = non supervisé
  problemType: null, // null = détection automatique
  algorithms: [], // vide = tous les algorithmes
  nClusters: null, // null = choix automatique du k
}

/** Relit le dataset sauvegardé (survit au rafraîchissement de la page). */
function loadStoredDataset() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function storeDataset(dataset) {
  try {
    if (dataset) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataset))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // stockage indisponible : on ignore, l'application fonctionne quand même
  }
}

export function AnalysisProvider({ children }) {
  const [dataset, setDatasetState] = useState(loadStoredDataset) // { dataset_id, filename, preview }
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [analysis, setAnalysis] = useState(null) // réponse complète de /analyze
  const [status, setStatus] = useState('idle') // 'idle' | 'running' | 'error'
  const [error, setError] = useState(null)

  /** Nouveau dataset : on repart de zéro (configuration et résultats effacés). */
  function setDataset(data) {
    setDatasetState(data)
    storeDataset(data)
    setConfig(DEFAULT_CONFIG)
    setAnalysis(null)
    setStatus('idle')
    setError(null)
  }

  /** Modifie une partie de la configuration, par exemple updateConfig({ target: 'species' }). */
  function updateConfig(patch) {
    setConfig((current) => ({ ...current, ...patch }))
  }

  /** Lance l'analyse. Renvoie true si elle a réussi, pour que la page puisse naviguer. */
  async function launchAnalysis() {
    if (!dataset) return false

    setStatus('running')
    setError(null)
    try {
      const result = await runAnalysis(dataset.dataset_id, config)
      setAnalysis(result)
      setStatus('idle')
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('error')
      return false
    }
  }

  /** Efface tout et revient à l'état initial. */
  function reset() {
    setDataset(null)
  }

  const value = {
    dataset,
    config,
    analysis,
    status,
    error,
    isRunning: status === 'running',
    setDataset,
    updateConfig,
    launchAnalysis,
    reset,
  }

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
}

/** Hook d'accès : const { dataset, config, analysis } = useAnalysis() */
export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysis doit être utilisé à l\'intérieur de <AnalysisProvider>.')
  }
  return context
}