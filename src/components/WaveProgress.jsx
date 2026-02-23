/**
 * Liquid wave animation like https://uiverse.io/abuayaan01/tall-mayfly-66
 * Rotating ellipses create the wave effect; no button, progress shown by clip width.
 */
function WaveProgress({ rate = 0, height = 56 }) {
  const widthPct = Math.min(100, Math.max(0, rate))

  return (
    <div className="wave-graph-wrap" style={{ height }} aria-hidden>
      <div className="wave-liquid-clip" style={{ width: `${widthPct}%` }}>
        <div className="wave-liquid">
          {/* ::before and ::after in CSS do the rotating wave */}
        </div>
      </div>
    </div>
  )
}

export default WaveProgress
