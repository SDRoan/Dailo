import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProfilePowerCard from '../components/ProfilePowerCard'
import {
  getCompletionTimes,
  getCompletions,
  getFocusMinutes,
  getHabits,
  getTimeSpent,
  getTasks,
} from '../lib/storage'
import { useAuth } from '../context/AuthContext'
import { buildWeeklySeasonSummary } from '../lib/weeklyGame'

function ProfilePage() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [timeSpent, setTimeSpent] = useState({})
  const [tasks, setTasks] = useState({})
  const [completionTimes, setCompletionTimes] = useState({})
  const [focusMinutes, setFocusMinutes] = useState({})

  useEffect(() => {
    document.title = 'Dailo – Trainer Card'
    return () => {
      document.title = 'Dailo'
    }
  }, [])

  useEffect(() => {
    setHabits(getHabits())
    setCompletions(getCompletions())
    setTimeSpent(getTimeSpent())
    setTasks(getTasks())
    setCompletionTimes(getCompletionTimes())
    setFocusMinutes(getFocusMinutes())
  }, [user?.id])

  const completionDatesByHabit = useMemo(() => {
    return habits.reduce((acc, habit) => {
      const fromCompletions = Object.keys(completions[habit.id] || {}).filter((date) => (completions[habit.id] || {})[date])
      const fromTime = Object.keys(timeSpent[habit.id] || {}).filter((date) => ((timeSpent[habit.id] || {})[date] || 0) > 0)
      acc[habit.id] = [...new Set([...fromCompletions, ...fromTime])]
      return acc
    }, {})
  }, [habits, completions, timeSpent])

  const seasonSummary = buildWeeklySeasonSummary({
    habits,
    completionDatesByHabit,
    tasks,
    completionTimes,
    focusMinutes,
    seasonSeed: user?.id || user?.email || 'local',
  })

  return (
    <div className="app profile-page">
      <nav className="app-nav profile-page-nav">
        <Link to="/app" className="app-nav-back" aria-label="Back to tracker">
          <span className="app-nav-back-glyph" aria-hidden>←</span>
          <span className="app-nav-back-label">Tracker</span>
        </Link>
        <Link to="/" className="app-nav-brand" aria-label="Dailo">Dailo</Link>
        <div className="app-nav-actions" aria-hidden />
      </nav>

      <header className="profile-hero">
        <p className="profile-hero-eyebrow">Trainer Archive</p>
        <h1 className="profile-hero-title">
          Your activity,<br />
          <span className="profile-hero-accent">as a trainer card.</span>
        </h1>
        <p className="profile-hero-sub">
          A living identity shaped by everything you&rsquo;ve tracked. This week: {seasonSummary.rank.current.name} League, {seasonSummary.current.xp} XP, {seasonSummary.current.questsCompleted} quests cleared.
        </p>
      </header>

      <ProfilePowerCard
        user={user}
        habits={habits}
        completionDatesByHabit={completionDatesByHabit}
        tasks={tasks}
        completionTimes={completionTimes}
        focusMinutes={focusMinutes}
        seasonSummary={seasonSummary}
      />
    </div>
  )
}

export default ProfilePage
