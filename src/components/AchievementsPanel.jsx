import { useState, useEffect, useRef } from 'react'
import { getAchievements } from '../lib/storage'
import { checkForNewAchievements } from '../lib/achievements'

const CATEGORY_LABELS = {
  streak: 'Streaks',
  consistency: 'Consistency',
  volume: 'Volume',
  improvement: 'Improvement',
  perfect: 'Perfect Days',
  variety: 'Variety',
  focus: 'Focus',
  tasks: 'Tasks',
  weekend: 'Weekend',
  earlybird: 'Early Bird',
}

const CATEGORY_ORDER = ['streak', 'consistency', 'volume', 'improvement', 'perfect', 'variety', 'focus', 'tasks', 'weekend', 'earlybird']

function AchievementsPanel({ habits, completions, timeSpent, tasks, completionTimes, focusMinutes }) {
  const [achievements, setAchievements] = useState([])
  const [newlyEarned, setNewlyEarned] = useState([])
  const [filter, setFilter] = useState('all')
  const [showToast, setShowToast] = useState(false)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) return
    if (!habits || habits.length === 0) {
      setAchievements(getAchievements())
      return
    }
    hasChecked.current = true

    const result = checkForNewAchievements({
      habits,
      completions: completions || {},
      timeSpent: timeSpent || {},
      tasks: tasks || {},
      completionTimes: completionTimes || {},
      focusMinutes: focusMinutes || {},
    })

    setAchievements(result.allAchievements)
    if (result.newAchievements.length > 0) {
      setNewlyEarned(result.newAchievements)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 6000)
    }
  }, [habits, completions, timeSpent, tasks, completionTimes, focusMinutes])

  // Re-check when data changes (after initial check)
  useEffect(() => {
    if (!hasChecked.current || !habits || habits.length === 0) return
    const timeout = setTimeout(() => {
      const result = checkForNewAchievements({
        habits,
        completions: completions || {},
        timeSpent: timeSpent || {},
        tasks: tasks || {},
        completionTimes: completionTimes || {},
        focusMinutes: focusMinutes || {},
      })
      setAchievements(result.allAchievements)
      if (result.newAchievements.length > 0) {
        setNewlyEarned(prev => [...prev, ...result.newAchievements])
        setShowToast(true)
        setTimeout(() => setShowToast(false), 6000)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [completions, timeSpent, tasks])

  const categories = {}
  for (const a of achievements) {
    if (!categories[a.category]) categories[a.category] = []
    categories[a.category].push(a)
  }

  const filteredAchievements = filter === 'all'
    ? [...achievements].reverse()
    : achievements.filter(a => a.category === filter).reverse()

  const newIds = new Set(newlyEarned.map(a => a.id))

  if (achievements.length === 0) {
    return (
      <section className="achievements-section">
        <div className="achievements-header">
          <h2>Achievements</h2>
          <span className="achievements-count">0 earned</span>
        </div>
        <div className="achievements-empty">
          <p>No achievements yet. Keep tracking your habits — achievements are generated from your real progress. No limits, no pre-set badges. Just you vs. you.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="achievements-section">
      {showToast && newlyEarned.length > 0 && (
        <div className="achievement-toast">
          <div className="achievement-toast-inner">
            <span className="achievement-toast-emoji">{newlyEarned[newlyEarned.length - 1].emoji}</span>
            <div className="achievement-toast-text">
              <strong>New Achievement!</strong>
              <span>{newlyEarned[newlyEarned.length - 1].title}</span>
            </div>
          </div>
        </div>
      )}

      <div className="achievements-header">
        <h2>Achievements</h2>
        <span className="achievements-count">{achievements.length} earned</span>
      </div>

      <div className="achievements-stats-row">
        {CATEGORY_ORDER.filter(cat => categories[cat]).map(cat => (
          <button
            key={cat}
            className={`achievements-stat-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(f => f === cat ? 'all' : cat)}
          >
            <span className="chip-count">{categories[cat].length}</span>
            <span className="chip-label">{CATEGORY_LABELS[cat]}</span>
          </button>
        ))}
      </div>

      <div className="achievements-grid">
        {filteredAchievements.map(a => (
          <div
            key={a.id}
            className={`achievement-card ${newIds.has(a.id) ? 'newly-earned' : ''}`}
          >
            <div className="achievement-card-emoji">{a.emoji}</div>
            <div className="achievement-card-body">
              <h3 className="achievement-card-title">{a.title}</h3>
              <p className="achievement-card-desc">{a.description}</p>
              <span className="achievement-card-meta">
                {CATEGORY_LABELS[a.category] || a.category} &middot; {new Date(a.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AchievementsPanel
