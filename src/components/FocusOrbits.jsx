/**
 * Orbiting dots on circular tracks — hypnotic, addictive to watch.
 * Separate from the breathing circle; pure visual pull.
 */
function FocusOrbits() {
  return (
    <div className="focus-orbits" aria-hidden>
      <div className="focus-orbit-track focus-orbit-inner">
        <span className="focus-orbit-dot" />
      </div>
      <div className="focus-orbit-track focus-orbit-mid">
        <span className="focus-orbit-dot" />
      </div>
      <div className="focus-orbit-track focus-orbit-outer">
        <span className="focus-orbit-dot" />
      </div>
    </div>
  )
}

export default FocusOrbits
