import { useMemo } from 'react'
import { getWeeklyDataPoints } from '../lib/streaks'

const PAD = 4
const POINTS = 7

function FloatingProgressGraph({ dataPoints, width = 280, height = 56 }) {
  const { pathD, areaD, maxY } = useMemo(() => {
    const points = Array.isArray(dataPoints) && dataPoints.length > 0
      ? dataPoints
      : Array(POINTS).fill(0)
    const count = points.length
    const w = width - PAD * 2
    const h = height - PAD * 2
    const maxVal = Math.max(1, Math.max(...points))
    const scaleY = (v) => PAD + h - (v / maxVal) * h
    const scaleX = (i) => PAD + (i / (count - 1 || 1)) * w

    const coords = points.map((y, i) => [scaleX(i), scaleY(y)])
    const parts = []
    for (let i = 0; i < coords.length; i++) {
      const [x, y] = coords[i]
      if (i === 0) parts.push(`M ${x} ${y}`)
      else {
        const [px, py] = coords[i - 1]
        const cpX = (px + x) / 2
        parts.push(`Q ${cpX} ${py}, ${x} ${y}`)
      }
    }
    const pathD = parts.join(' ')
    const areaD = `${pathD} L ${scaleX(count - 1)} ${height - PAD} L ${scaleX(0)} ${height - PAD} Z`
    return { pathD, areaD }
  }, [dataPoints, width, height])

  return (
    <div className="floating-graph-wrap" aria-hidden>
      <svg
        className="floating-graph"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="graphGradient" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          className="floating-graph-area"
          d={areaD}
          fill="url(#graphGradient)"
        />
        <path
          className="floating-graph-line"
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default FloatingProgressGraph
