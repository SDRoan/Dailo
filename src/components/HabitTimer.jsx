import { useState, useEffect, useRef } from 'react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function HabitTimer({ habitName, onStop }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  const handleStart = () => {
    setRunning(true)
  }

  const handlePause = () => {
    setRunning(false)
  }

  const handleStop = () => {
    setRunning(false)
    const totalSeconds = elapsed
    const minutes = Math.max(1, Math.ceil(totalSeconds / 60))
    onStop(minutes)
    setElapsed(0)
  }

  const handleQuickAdd = (mins) => {
    onStop(mins)
  }

  return (
    <div className="habit-timer">
      <div className="habit-timer-display">{formatTime(elapsed)}</div>
      <div className="habit-timer-actions">
        {!running ? (
          <button type="button" className="btn-sm btn-timer-start" onClick={handleStart}>
            Start
          </button>
        ) : (
          <>
            <button type="button" className="btn-sm btn-timer-pause" onClick={handlePause}>
              Pause
            </button>
            <button type="button" className="btn-sm btn-timer-stop" onClick={handleStop}>
              Stop & save
            </button>
          </>
        )}
        {!running && elapsed === 0 && (
          <span className="habit-timer-quick">
            <button type="button" className="btn-sm ghost" onClick={() => handleQuickAdd(15)}>+15 min</button>
            <button type="button" className="btn-sm ghost" onClick={() => handleQuickAdd(30)}>+30 min</button>
          </span>
        )}
      </div>
    </div>
  )
}

export default HabitTimer
