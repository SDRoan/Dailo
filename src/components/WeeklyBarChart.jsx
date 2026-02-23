/**
 * Vertical bar chart: one bar per day (last 7 days). Height = time spent (minutes).
 * Up and down by total time per day; scale is relative to max in the week.
 */
function WeeklyBarChart({ dataPoints = [], height = 48, maxMinutes = 60 }) {
  const points = Array.isArray(dataPoints) && dataPoints.length > 0
    ? dataPoints
    : Array(7).fill(0)
  const max = Math.max(...points, 1, maxMinutes)
  const scale = (v) => Math.max(8, (v / max) * 100)

  return (
    <div className="weekly-barchart-wrap" style={{ height }} aria-hidden>
      <div className="weekly-barchart-bars">
        {points.map((value, i) => (
          <div
            key={i}
            className={`weekly-barchart-bar ${value > 0 ? 'completed' : ''}`}
            style={{ height: `${scale(value)}%` }}
            title={value > 0 ? `${value} min` : 'No time'}
          />
        ))}
      </div>
    </div>
  )
}

export default WeeklyBarChart
