/**
 * Simple vertical bar chart for 7 days (e.g. daily completion count or %).
 * dataPoints: array of 7 numbers. Labels optional (e.g. Mon, Tue, ...).
 */
function WeeklyBarChartSimple({ dataPoints = [], maxValue, height = 48 }) {
  const points = Array.isArray(dataPoints) && dataPoints.length > 0 ? dataPoints : []
  if (points.length === 0) return null

  const max = maxValue != null ? maxValue : Math.max(1, ...points)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="weekly-bar-simple" style={{ height }}>
      <div className="weekly-bar-simple-bars">
        {points.slice(0, 7).map((value, i) => (
          <div key={i} className="weekly-bar-simple-bar-wrap">
            <div
              className="weekly-bar-simple-bar"
              style={{ height: `${(value / max) * 100}%` }}
              title={`${value}`}
            />
          </div>
        ))}
      </div>
      <div className="weekly-bar-simple-labels">
        {dayLabels.slice(0, points.length).map((label, i) => (
          <span key={i} className="weekly-bar-simple-label">{label}</span>
        ))}
      </div>
    </div>
  )
}

export default WeeklyBarChartSimple
