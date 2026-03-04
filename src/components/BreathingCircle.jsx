/**
 * Soft pulsing circle for the Focus page — 4s inhale, 4s exhale.
 * Outer depth ring + inhale/exhale cue synced to the same cycle.
 */
function BreathingCircle() {
  return (
    <div className="breathing-circle-wrap" aria-hidden>
      <div className="breathing-circle-outer" />
      <div className="breathing-circle" />
      <div className="breathing-cue">
        <span className="breathing-cue-inhale">Inhale</span>
        <span className="breathing-cue-exhale">Exhale</span>
      </div>
    </div>
  )
}

export default BreathingCircle
