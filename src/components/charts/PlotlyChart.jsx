import createPlotlyComponentModule from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'

// Compatibilité ESM/CommonJS : selon la version, la fabrique est dans .default
const createPlotlyComponent = createPlotlyComponentModule.default ?? createPlotlyComponentModule
const Plot = createPlotlyComponent(Plotly)
const GRID = '#e1e7f0'
const TEXT = '#0f172a'
function themeAxis(axis = {}) {
  return { ...axis, gridcolor: GRID, zerolinecolor: GRID, linecolor: GRID }
}

/**
 * Affiche une figure Plotly envoyée par le backend ({ data, layout })
 * en remplaçant le thème clair par le thème sombre de l'application.
 */
export default function PlotlyChart({ figure, className = '' }) {
  if (!figure) return null

  const layout = {
    ...figure.layout,
    template: undefined,
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', color: TEXT, size: 12 },
    title: {
      ...figure.layout?.title,
      font: { family: 'Space Grotesk, sans-serif', size: 16, color: TEXT },
    },
    xaxis: themeAxis(figure.layout?.xaxis),
    yaxis: themeAxis(figure.layout?.yaxis),
    legend: { ...figure.layout?.legend, font: { color: TEXT } },
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-white p-2 ${className}`}>
      <Plot
        data={figure.data}
        layout={layout}
        config={{ displaylogo: false, responsive: true }}
        useResizeHandler
        style={{ width: '100%' }}
      />
    </div>
  )
}