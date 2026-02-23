/**
 * Area chart of daily completion % over the visible days (like FocusLab first pic).
 * One value per day; y = percentage, filled area.
 */
function OverallProgressChart({ dataPoints = [], height = 56 }) {
  const points = Array.isArray(dataPoints) && dataPoints.length > 0
    ? dataPoints
    : []
  if (points.length === 0) return null

  const width = 400
  const pad = 8
  const w = width - pad * 2
  const h = height - pad * 2
  const max = Math.max(100, ...points)
  const scaleY = (v) => pad + h - (v / max) * h
  const scaleX = (i) => pad + (i / (points.length - 1 || 1)) * w

  const pathD = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`)
    .join(' ')
  const areaD = `${pathD} L ${scaleX(points.length - 1)} ${height - pad} L ${pad} ${height - pad} Z`

  return (
    <div className="overall-progress-chart">
      <div className="overall-progress-chart-label">Progress</div>
      <svg
        className="overall-progress-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="overallProgressGradient" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#overallProgressGradient)" />
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default OverallProgressChart
