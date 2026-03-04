/**
 * Very subtle drifting dots in the background — adds life without distraction.
 */
const DOTS = 18
const positions = [
  [10, 15], [25, 8], [85, 12], [70, 22], [15, 75], [90, 80], [50, 5], [5, 50],
  [95, 45], [30, 90], [60, 70], [75, 55], [20, 35], [80, 30], [40, 85], [55, 18],
  [12, 60], [88, 68],
]

function FocusAmbient() {
  return (
    <div className="focus-page-ambient" aria-hidden>
      {Array.from({ length: DOTS }, (_, i) => (
        <span
          key={i}
          className="focus-ambient-dot"
          style={{
            left: `${positions[i % positions.length][0]}%`,
            top: `${positions[i % positions.length][1]}%`,
            animationDelay: `${(i * 1.2) % 20}s`,
            animationDuration: `${22 + (i % 6)}s`,
          }}
        />
      ))}
    </div>
  )
}

export default FocusAmbient
