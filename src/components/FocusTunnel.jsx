/**
 * Infinite tunnel — rings expand from center and fade. Hypnotic, addictive to watch.
 * Replaces breathing; gives the eye a single flow to follow during focus.
 */
const RING_COUNT = 10
const DURATION = 4

function FocusTunnel() {
  return (
    <div className="focus-tunnel" aria-hidden>
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <div
          key={i}
          className="focus-tunnel-ring"
          style={{
            animationDuration: `${DURATION}s`,
            animationDelay: `${(i / RING_COUNT) * DURATION}s`,
          }}
        />
      ))}
      <div className="focus-tunnel-core" />
    </div>
  )
}

export default FocusTunnel
