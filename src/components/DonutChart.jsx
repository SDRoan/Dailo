/**
 * Donut chart showing completed / total (e.g. "33 / 47 Completed").
 * Size in px; completed and total are numbers.
 */
function DonutChart({ completed = 0, total = 1, size = 80, label = 'Completed' }) {
  const safeTotal = Math.max(1, total)
  const pct = Math.min(1, completed / safeTotal)
  const r = (size - 8) / 2
  const cx = size / 2
  const cy = size / 2
  const stroke = 8
  const circumference = 2 * Math.PI * (r - stroke / 2)
  const dash = circumference * pct

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="donut-chart-bg"
          cx={cx}
          cy={cy}
          r={r - stroke / 2}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="donut-chart-fill"
          cx={cx}
          cy={cy}
          r={r - stroke / 2}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="donut-chart-center">
        <span className="donut-chart-value">{completed} / {total}</span>
        <span className="donut-chart-label">{label}</span>
      </div>
    </div>
  )
}

export default DonutChart
