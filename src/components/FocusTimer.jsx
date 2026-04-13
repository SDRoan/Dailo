import { useState, useEffect, useRef } from 'react'
import { todayKey, dateKey, addFocusMinutes, getFocusMinutes, getFocusSession, saveFocusSession } from '../lib/storage'
import { FlameIcon } from './Icons'

const DEFAULT_WORK_MIN = 25
const DEFAULT_BREAK_MIN = 5

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const FOCUS_MILESTONES = [25, 50, 90, 120]

function calculateFocusStreak(data) {
  let streak = 0
  const d = new Date()
  // Count consecutive days (including today) with any focused minutes
  // Uses local timezone via dateKey helper.
  while (true) {
    const key = dateKey(d)
    if ((data[key] || 0) > 0) {
      streak += 1
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function FocusTimer({ open, onClose, standalone = false, onOpenInWindow, allowPointerThrough = false, compact = false }) {
  const [phase, setPhase] = useState('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_WORK_MIN * 60)
  const [isPaused, setIsPaused] = useState(false)
  const [workMin, setWorkMin] = useState(DEFAULT_WORK_MIN)
  const [breakMin, setBreakMin] = useState(DEFAULT_BREAK_MIN)
  const intervalRef = useRef(null)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [focusStreak, setFocusStreak] = useState(0)
  const [milestoneMessage, setMilestoneMessage] = useState('')
  const isVisible = standalone || open

  const refreshStatsFromStorage = () => {
    const data = getFocusMinutes()
    const today = todayKey()
    setTodayMinutes(data[today] || 0)
    setFocusStreak(calculateFocusStreak(data))
  }

  useEffect(() => {
    if (!isVisible) return
    refreshStatsFromStorage()
  }, [isVisible])

  // Restore session when standalone window loads
  useEffect(() => {
    if (!standalone) return
    const session = getFocusSession()
    if (!session || !session.phase) return
    setWorkMin(session.workMin ?? DEFAULT_WORK_MIN)
    setBreakMin(session.breakMin ?? DEFAULT_BREAK_MIN)
    setPhase(session.phase)
    setIsPaused(!!session.isPaused)
    if (session.phase === 'work' || session.phase === 'break') {
      if (session.isPaused && typeof session.remainingSeconds === 'number') {
        setRemainingSeconds(session.remainingSeconds)
      } else if (session.endTime && session.endTime > Date.now()) {
        setRemainingSeconds(Math.max(0, Math.ceil((session.endTime - Date.now()) / 1000)))
      } else if (session.endTime && session.endTime <= Date.now()) {
        setRemainingSeconds(0)
      }
    } else {
      setRemainingSeconds((session.workMin ?? DEFAULT_WORK_MIN) * 60)
    }
  }, [standalone])

  const recordFocusMinutes = (minutes) => {
    if (!minutes || minutes <= 0) return
    const data = addFocusMinutes(todayKey(), minutes)
    const today = todayKey()
    setTodayMinutes((prev) => {
      const before = prev || 0
      const after = data[today] || 0
      const hit = FOCUS_MILESTONES.find((m) => before < m && after >= m)
      if (hit) {
        setMilestoneMessage(`You just hit ${hit} minutes of focused time today.`)
        window.setTimeout(() => {
          setMilestoneMessage('')
        }, 6000)
      }
      return after
    })
    setFocusStreak(calculateFocusStreak(data))
  }

  const persistSession = (p, secs, paused) => {
    if (!standalone) return
    if (p === 'idle') {
      saveFocusSession(null)
      return
    }
    saveFocusSession({
      phase: p,
      endTime: paused ? 0 : Date.now() + secs * 1000,
      workMin,
      breakMin,
      isPaused: paused,
      remainingSeconds: paused ? secs : undefined,
    })
  }

  useEffect(() => {
    if (!isVisible) return
    if (phase !== 'work' && phase !== 'break') return
    if (isPaused) return
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          if (phase === 'work') {
            recordFocusMinutes(workMin)
            setPhase('break')
            setRemainingSeconds(breakMin * 60)
            persistSession('break', breakMin * 60, false)
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)()
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.frequency.value = 880
              gain.gain.value = 0.15
              osc.start(ctx.currentTime)
              osc.stop(ctx.currentTime + 0.15)
            } catch (_) {}
          } else {
            setPhase('idle')
            setRemainingSeconds(workMin * 60)
            persistSession('idle')
          }
          return 0
        }
        const next = prev - 1
        persistSession(phase, next, false)
        return next
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isVisible, phase, isPaused, breakMin, workMin])

  const startWork = () => {
    const secs = workMin * 60
    setRemainingSeconds(secs)
    setPhase('work')
    setIsPaused(false)
    persistSession('work', secs, false)
  }

  const skipToBreak = () => {
    if (phase === 'work') {
      const left = remainingSeconds
      const done = workMin * 60 - left
      if (done > 0) recordFocusMinutes(Math.ceil(done / 60))
    }
    const secs = breakMin * 60
    setPhase('break')
    setRemainingSeconds(secs)
    setIsPaused(false)
    persistSession('break', secs, false)
  }

  const endSession = () => {
    if (phase === 'work') {
      const left = remainingSeconds
      const done = workMin * 60 - left
      if (done > 0) recordFocusMinutes(Math.ceil(done / 60))
    }
    setPhase('idle')
    setRemainingSeconds(workMin * 60)
    setIsPaused(false)
    persistSession('idle')
  }

  const togglePause = () => {
    const next = !isPaused
    setIsPaused(next)
    if (standalone) {
      if (next) persistSession(phase, remainingSeconds, true)
      else persistSession(phase, remainingSeconds, false)
    }
  }

  // Keep window title updated with countdown so it stays visible in dock/taskbar
  useEffect(() => {
    if (!standalone) return
    if (phase === 'work' || phase === 'break') {
      const t = formatTime(remainingSeconds)
      const label = phase === 'work' ? 'Focus' : 'Break'
      document.title = `Dailo · ${label} ${t}`
    } else {
      document.title = 'Dailo – Focus'
    }
    return () => { document.title = 'Dailo – Focus' }
  }, [standalone, phase, remainingSeconds])

  if (!isVisible) return null

  const nextMilestone = FOCUS_MILESTONES.find((m) => m > todayMinutes)

  if (compact) {
    return (
      <div className={`focus-timer-popup focus-timer-compact${allowPointerThrough ? ' focus-timer-pointer-through' : ''}`}>
        {onClose && (
          <button type="button" className="focus-timer-close focus-timer-close-corner" onClick={onClose} aria-label="Close">×</button>
        )}
        <div className="focus-timer-compact-inner">
          {phase === 'idle' && (
            <button type="button" className="focus-timer-compact-start" onClick={startWork}>
              Start
            </button>
          )}
          {(phase === 'work' || phase === 'break') && (
            <>
              <span className="focus-timer-compact-phase">{phase === 'work' ? 'Focus' : 'Break'}</span>
              <span className="focus-timer-compact-countdown">{formatTime(remainingSeconds)}</span>
              <div className="focus-timer-compact-actions">
                <button type="button" className="focus-timer-compact-btn" onClick={togglePause}>
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button type="button" className="focus-timer-compact-btn danger" onClick={endSession}>
                  End
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`focus-timer-popup${allowPointerThrough ? ' focus-timer-pointer-through' : ''}`}>
      <div className="focus-timer-header">
        <span className="focus-timer-title">Focus timer</span>
        {onClose && (
        <button type="button" className="focus-timer-close" onClick={onClose} aria-label="Close">×</button>
      )}
      </div>
      <div className="focus-timer-body">
        {phase === 'idle' && (
          <>
            <div className="focus-timer-durations">
              <label>
                <span>Work (min)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={workMin}
                  onChange={(e) => setWorkMin(Math.max(1, Math.min(60, Number(e.target.value) || 25)))}
                />
              </label>
              <label>
                <span>Break (min)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Math.max(1, Math.min(30, Number(e.target.value) || 5)))}
                />
              </label>
            </div>
            <button type="button" className="focus-timer-start" onClick={startWork}>
              Start focus
            </button>
          </>
        )}
        {(phase === 'work' || phase === 'break') && (
          <>
            <p className="focus-timer-phase">{phase === 'work' ? 'Focus' : 'Break'}</p>
            <p className="focus-timer-countdown">{formatTime(remainingSeconds)}</p>
            <div className="focus-timer-actions">
              <button type="button" className="focus-timer-btn" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              {phase === 'work' && (
                <button type="button" className="focus-timer-btn" onClick={skipToBreak}>
                  Skip to break
                </button>
              )}
              <button type="button" className="focus-timer-btn danger" onClick={endSession}>
                End session
              </button>
            </div>
          </>
        )}
        <div className="focus-timer-summary">
          <p className="focus-timer-summary-main">
            {todayMinutes > 0 ? `${todayMinutes} min focused today` : 'No focused minutes yet today'}
          </p>
          {nextMilestone != null && (
            <p className="focus-timer-summary-next">
              {todayMinutes > 0
                ? `${nextMilestone - todayMinutes} min to your next streak milestone`
                : `First milestone at ${nextMilestone} focused minutes`}
            </p>
          )}
          {focusStreak > 1 && (
            <p className="focus-timer-summary-streak">
              <FlameIcon size={14} /> {focusStreak}-day focus streak
            </p>
          )}
          {milestoneMessage && (
            <p className="focus-timer-summary-milestone">{milestoneMessage}</p>
          )}
          {standalone && (phase === 'work' || phase === 'break') && (
            <p className="focus-timer-keep-open" role="status">
              Keep this window open — use “End session” when done. It stays in the dock when you switch tabs.
            </p>
          )}
          {!standalone && onOpenInWindow && (
            <p className="focus-timer-open-window-wrap">
              <button type="button" className="focus-timer-open-window" onClick={onOpenInWindow}>
                Open in new window
              </button>
              <span className="focus-timer-open-window-hint"> — see timer when you switch tabs</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FocusTimer
