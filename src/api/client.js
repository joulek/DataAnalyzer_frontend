import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  // L'entraînement de plusieurs modèles peut prendre du temps
  timeout: 180000,
})

/**
 * Extrait un message lisible d'une erreur axios.
 * Le backend renvoie { detail: "..." } (400, 404, 413) ou une liste (422).
 */
export function getErrorMessage(error) {
  if (error.response) {
    const detail = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join(' ; ')
    }
    return `Erreur du serveur (${error.response.status}).`
  }
  if (error.code === 'ECONNABORTED') {
    return "L'analyse a pris trop de temps. Essayez avec un dataset plus petit."
  }
  return "Impossible de joindre le serveur. Vérifiez que le backend est lancé."
}

/** Envoie le dataset (CSV ou XLSX) et renvoie { dataset_id, filename, preview }. */
export async function uploadDataset(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post('/upload', formData, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
  return data
}

/** Aperçu d'un dataset déjà uploadé. */
export async function fetchPreview(datasetId) {
  const { data } = await api.get(`/datasets/${datasetId}/preview`)
  return data
}

/** Graphiques d'exploration : histogrammes, corrélations, valeurs manquantes. */
export async function fetchDatasetCharts(datasetId) {
  const { data } = await api.get(`/datasets/${datasetId}/charts`)
  return data
}

/** Proposition de type de problème selon la cible choisie (ou absente). */
export async function detectProblem(datasetId, target, problemType) {
  const params = {}
  if (target) params.target = target
  if (problemType) params.problem_type = problemType

  const { data } = await api.get(`/datasets/${datasetId}/detect`, { params })
  return data
}

/**
 * Lance l'analyse complète.
 * options : { target, problemType, algorithms, nClusters }
 */
export async function runAnalysis(datasetId, options = {}) {
  const { target, problemType, algorithms, nClusters } = options

  const { data } = await api.post('/analyze', {
    dataset_id: datasetId,
    target: target || null,
    problem_type: problemType || null,
    algorithms: algorithms && algorithms.length > 0 ? algorithms : null,
    n_clusters: nClusters || null,
  })
  return data
}

/** Télécharge le rapport PDF de l'analyse (données, prétraitement, résultats). */
export async function downloadReport(datasetId, filename, analysis) {
  const { data } = await api.post(
    '/report',
    { dataset_id: datasetId, filename, analysis },
    { responseType: 'blob' }
  )

  const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `rapport_${(filename || 'analyse').replace(/\.[^.]+$/, '')}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
/** Télécharge le notebook Jupyter qui reproduit l'analyse. */
export async function downloadNotebook(datasetId, filename, analysis) {
  const { data } = await api.post(
    '/notebook',
    { dataset_id: datasetId, filename, analysis },
    { responseType: 'blob' }
  )

  const url = URL.createObjectURL(new Blob([data], { type: 'application/x-ipynb+json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `analyse_${(filename || 'analyse').replace(/\.[^.]+$/, '')}.ipynb`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Pose une question à l'assistant, avec les derniers échanges pour la continuité. */
export async function askAssistant(question, analysis = null, history = []) {
  const { data } = await api.post('/chat', { question, analysis, history })
  return data
}
/** Pose une question et reçoit la réponse au fil de l'eau. onEvent reçoit chaque événement. */
export async function streamAssistant(question, analysis, history, onEvent) {
  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, analysis, history }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Erreur du serveur (${response.status}).`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop()
    for (const part of parts) {
      if (part.startsWith('data: ')) onEvent(JSON.parse(part.slice(6)))
    }
  }
}
/** Enregistre un vote (up ou down) sur une réponse de l'assistant. */
export async function sendFeedback(question, answer, mode, vote) {
  await api.post('/feedback', { question, answer, mode, vote })
}