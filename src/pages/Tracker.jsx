import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getHabits, saveHabits, getCompletions, saveCompletions, getTimeSpent, saveTimeSpent, addTimeForDay, getTasks, saveTasks, getCompletionTimes, saveCompletionTimes, getIfThenPlans, saveIfThenPlans, todayKey, getCurrentWeekDates, getTwoWeeksDates, getFocusMinutes } from '../lib/storage'
import { getStreak, getWeeklyCount } from '../lib/streaks'
import { getReminderTimes, saveReminderTimes, checkAndNotify } from '../lib/reminders'
import CalendarView from '../components/CalendarView'
import OverallProgressChart from '../components/OverallProgressChart'
import DonutChart from '../components/DonutChart'
import WeeklyBarChartSimple from '../components/WeeklyBarChartSimple'
import DailyTasksList from '../components/DailyTasksList'
import AchievementsPanel from '../components/AchievementsPanel'
import FocusTimer from '../components/FocusTimer'
import WeeklySeasonPanel from '../components/WeeklySeasonPanel'
import { FlameIcon, TargetIcon, EditIcon, TrashIcon, CheckIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import UserAvatar from '../components/UserAvatar'
import { buildWeeklySeasonSummary } from '../lib/weeklyGame'

function Tracker() {
  const { user, cloudError, signOut } = useAuth()
  const [habits, setHabits] = useState([])
  const [focusOpen, setFocusOpen] = useState(false)
  const [completions, setCompletions] = useState({})
  const [newHabitName, setNewHabitName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [viewDays, setViewDays] = useState(14)
  const [reminders, setReminders] = useState({})
  const [reminderOpenId, setReminderOpenId] = useState(null)
  const [newHabitGoal, setNewHabitGoal] = useState('')
  const now = new Date()
  const [calendarMonth, setCalendarMonth] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [calendarHabitId, setCalendarHabitId] = useState(null)
  const [calendarTaskDate, setCalendarTaskDate] = useState(todayKey())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [timeSpent, setTimeSpent] = useState({})
  const [tasks, setTasks] = useState({})
  const [completionTimes, setCompletionTimes] = useState({})
  const [ifThenPlans, setIfThenPlans] = useState({})
  const [planOpenId, setPlanOpenId] = useState(null)
  const [planCueInput, setPlanCueInput] = useState('')
  const [planActionInput, setPlanActionInput] = useState('')
  const [focusMin, setFocusMin] = useState({})
  const [signingOut, setSigningOut] = useState(false)
  const composerInputRef = useRef(null)

  useEffect(() => {
    setHabits(getHabits())
    setCompletions(getCompletions())
    setReminders(getReminderTimes())
    setTimeSpent(getTimeSpent())
    setTasks(getTasks())
    setCompletionTimes(getCompletionTimes())
    setIfThenPlans(getIfThenPlans())
    setFocusMin(getFocusMinutes())
  }, [user?.id])

  const persistTasks = useCallback((next) => {
    setTasks(next)
    saveTasks(next)
  }, [])

  const addTimeForHabit = (habitId, minutes) => {
    const today = todayKey()
    const nextTime = addTimeForDay(timeSpent, habitId, today, minutes)
    setTimeSpent(nextTime)
    saveTimeSpent(nextTime)
    const byHabit = completions[habitId] || {}
    if (!byHabit[today]) {
      const nextComp = { ...completions, [habitId]: { ...byHabit, [today]: true } }
      setCompletions(nextComp)
      saveCompletions(nextComp)
    }
  }

  useEffect(() => {
    const runReminderCheck = () => {
      const today = todayKey()
      checkAndNotify(habits, reminders, (habitId) => !!(completions[habitId] || {})[today])
    }
    runReminderCheck()
    const interval = setInterval(runReminderCheck, 30_000)
    const onVisible = () => {
      if (!document.hidden) runReminderCheck()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [habits, reminders, completions])

  const persistHabits = useCallback((next) => {
    setHabits(next)
    saveHabits(next)
  }, [])

  const persistCompletions = useCallback((next) => {
    setCompletions(next)
    saveCompletions(next)
  }, [])

  const persistIfThenPlans = useCallback((next) => {
    setIfThenPlans(next)
    saveIfThenPlans(next)
  }, [])

  const addHabit = () => {
    const name = newHabitName.trim()
    if (!name) {
      composerInputRef.current?.focus()
      return
    }
    const id = crypto.randomUUID()
    const goal = newHabitGoal ? Number(newHabitGoal) : undefined
    persistHabits([...habits, { id, name, createdAt: new Date().toISOString(), goal }])
    setNewHabitName('')
    setNewHabitGoal('')
    composerInputRef.current?.focus()
  }

  const updateHabit = (id, name, goalValue) => {
    if (!name.trim()) return
    const updates = { name: name.trim() }
    updates.goal = goalValue ? Number(goalValue) : undefined
    persistHabits(habits.map((h) => (h.id === id ? { ...h, ...updates } : h)))
    setEditingId(null)
    setEditName('')
    setEditGoal('')
  }

  const deleteHabit = (id) => {
    persistHabits(habits.filter((h) => h.id !== id))
    const next = { ...completions }
    delete next[id]
    persistCompletions(next)
    const nextRem = { ...reminders }
    delete nextRem[id]
    setReminders(nextRem)
    saveReminderTimes(nextRem)
    const nextTime = { ...timeSpent }
    delete nextTime[id]
    setTimeSpent(nextTime)
    saveTimeSpent(nextTime)
    const nextCompTimes = { ...completionTimes }
    delete nextCompTimes[id]
    setCompletionTimes(nextCompTimes)
    saveCompletionTimes(nextCompTimes)
    const nextPlans = { ...ifThenPlans }
    delete nextPlans[id]
    persistIfThenPlans(nextPlans)
    if (reminderOpenId === id) setReminderOpenId(null)
    if (planOpenId === id) setPlanOpenId(null)
  }

  const setIfThenPlan = (habitId, cue, action) => {
    const trimmedCue = cue.trim()
    const trimmedAction = action.trim()
    if (!trimmedCue || !trimmedAction) {
      const next = { ...ifThenPlans }
      delete next[habitId]
      persistIfThenPlans(next)
    } else {
      persistIfThenPlans({
        ...ifThenPlans,
        [habitId]: { cue: trimmedCue, action: trimmedAction },
      })
    }
    setPlanOpenId(null)
    setPlanCueInput('')
    setPlanActionInput('')
  }

  const openPlanPopover = (habitId) => {
    setPlanOpenId(habitId)
    setReminderOpenId(null)
    const entry = ifThenPlans[habitId]
    setPlanCueInput(entry?.cue || '')
    setPlanActionInput(entry?.action || '')
  }

  const toggleCompletion = (habitId, dayKey) => {
    const byHabit = completions[habitId] || {}
    const willBeCompleted = !byHabit[dayKey]
    const next = { ...completions, [habitId]: { ...byHabit, [dayKey]: willBeCompleted } }
    persistCompletions(next)
    const byHabitTime = completionTimes[habitId] || {}
    if (willBeCompleted) {
      const nextTimes = { ...completionTimes, [habitId]: { ...byHabitTime, [dayKey]: new Date().toISOString() } }
      setCompletionTimes(nextTimes)
      saveCompletionTimes(nextTimes)
    } else {
      const nextByHabitTime = { ...byHabitTime }
      delete nextByHabitTime[dayKey]
      const nextTimes = { ...completionTimes }
      if (Object.keys(nextByHabitTime).length === 0) delete nextTimes[habitId]
      else nextTimes[habitId] = nextByHabitTime
      setCompletionTimes(nextTimes)
      saveCompletionTimes(nextTimes)
    }
  }

  const isCompleted = (habitId, dayKey) => !!(completions[habitId] || {})[dayKey]

  const days = viewDays === 7 ? getCurrentWeekDates() : getTwoWeeksDates()
  const today = todayKey()

  const completionDatesByHabit = habits.reduce((acc, h) => {
    const byHabit = completions[h.id] || {}
    const fromCompletions = Object.keys(byHabit).filter((d) => byHabit[d])
    const byTime = timeSpent[h.id] || {}
    const fromTime = Object.keys(byTime).filter((d) => (byTime[d] || 0) > 0)
    acc[h.id] = [...new Set([...fromCompletions, ...fromTime])]
    return acc
  }, {})

  const seasonSummary = buildWeeklySeasonSummary({
    habits,
    completionDatesByHabit,
    tasks,
    completionTimes,
    focusMinutes: focusMin,
    seasonSeed: user?.id || user?.email || 'local',
  })

  const dailyCompletionPcts = days.map((d) => {
    const count = habits.filter(
      (h) => isCompleted(h.id, d) || ((timeSpent[h.id] || {})[d] || 0) > 0
    ).length
    return habits.length ? Math.round((count / habits.length) * 100) : 0
  })

  const weekDates = getCurrentWeekDates()
  const weekCompletedCount = weekDates.reduce(
    (sum, d) =>
      sum +
      habits.filter(
        (h) => isCompleted(h.id, d) || ((timeSpent[h.id] || {})[d] || 0) > 0
      ).length,
    0
  )
  const weekTotalPossible = habits.length * 7 || 1
  const weekDailyCounts = weekDates.map((d) =>
    habits.filter(
      (h) => isCompleted(h.id, d) || ((timeSpent[h.id] || {})[d] || 0) > 0
    ).length
  )
  const startOfWeekDate = (() => {
    const [y, m, day] = weekDates[0].split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
  })()


  const getTasksForDay = (dateKey) => tasks[dateKey] || []
  const addTask = (dateKey, label) => {
    const list = getTasksForDay(dateKey)
    const id = crypto.randomUUID()
    const trimmed = label.trim()
    persistTasks({
      ...tasks,
      [dateKey]: [...list, { id, label: trimmed, completed: false }],
    })
  }
  const toggleTask = (dateKey, taskId) => {
    const list = getTasksForDay(dateKey).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    persistTasks({ ...tasks, [dateKey]: list })
  }
  const removeTask = (dateKey, taskId) => {
    const list = getTasksForDay(dateKey).filter((t) => t.id !== taskId)
    if (list.length === 0) {
      const next = { ...tasks }
      delete next[dateKey]
      persistTasks(next)
    } else persistTasks({ ...tasks, [dateKey]: list })
  }

  const MOTIVATIONAL_QUOTES = [
    'Inspiration comes only during work.',
    'Small steps lead to big changes.',
    'Consistency beats intensity.',
  ]
  const motivationalQuote = MOTIVATIONAL_QUOTES[Math.floor(weekDates[0].replace(/-/g, '')) % MOTIVATIONAL_QUOTES.length]
  const selectedCalendarTaskDateLabel = (() => {
    const [y, m, day] = calendarTaskDate.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  })()
  const calendarTaskCounts = Object.fromEntries(
    Object.entries(tasks).map(([date, list]) => [date, list.length])
  )
  const todaysPlannedHabits = habits.filter((habit) => {
    const plan = ifThenPlans[habit.id]
    const hasPlan = !!(plan?.cue && plan?.action)
    const doneToday = isCompleted(habit.id, today) || ((timeSpent[habit.id] || {})[today] || 0) > 0
    return hasPlan && !doneToday
  })

  const todayCompletedCount = habits.filter(
    (h) => isCompleted(h.id, today) || ((timeSpent[h.id] || {})[today] || 0) > 0
  ).length
  const heroHour = new Date().getHours()
  const heroGreeting =
    heroHour < 12 ? 'Good morning' : heroHour < 17 ? 'Good afternoon' : 'Good evening'
  const heroName = (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    ''
  )
    .split(' ')[0]
    .trim()
  const heroDateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const heroSub =
    habits.length === 0
      ? 'Add your first habit to start the loop.'
      : `${todayCompletedCount} of ${habits.length} complete today. ${seasonSummary.rank.current.name} League. ${seasonSummary.duel.pressureLine}`

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setSigningOut(false)
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <Link to="/" className="app-nav-back" aria-label="Home">
          <span className="app-nav-back-glyph" aria-hidden>←</span>
          <span className="app-nav-back-label">Home</span>
        </Link>
        <Link to="/" className="app-nav-brand" aria-label="Dailo">Dailo</Link>
        <div className="app-nav-actions">
          <button
            type="button"
            className="focus-timer-trigger"
            onClick={() => setFocusOpen(true)}
          >
            Focus
          </button>
          <Link to="/app/profile" className="app-avatar-link" aria-label="Open profile">
            <UserAvatar user={user} size={32} />
          </Link>
          <button type="button" className="btn auth-secondary-btn" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </nav>
      <FocusTimer
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        onOpenInWindow={() => {
          const width = 340
          const height = 560
          const left = Math.max(0, (window.screen?.availWidth ?? 800) - width - 24)
          const top = Math.max(0, (window.screen?.availHeight ?? 600) - height - 24)
          const w = window.open(
            `${window.location.origin}/app/focus`,
            'dailo-focus',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=yes`
          )
          if (w) w.focus()
        }}
      />
      <header className="hero">
        <div className="hero-text">
          <p className="hero-eyebrow">{heroDateLabel}</p>
          <h1 className="hero-title">
            {heroGreeting}
            {heroName ? <span className="hero-title-name">, {heroName}.</span> : '.'}
          </h1>
          <p className="hero-sub">{heroSub}</p>
        </div>
        <div className="hero-ring" aria-hidden={habits.length === 0}>
          <DonutChart
            completed={todayCompletedCount}
            total={Math.max(1, habits.length)}
            size={140}
            label="Today"
          />
        </div>
      </header>
      {cloudError ? (
        <section className="cloud-alert">
          <strong>Cloud sync needs one more step.</strong>
          <p>{cloudError}</p>
        </section>
      ) : null}

      <WeeklySeasonPanel summary={seasonSummary} />

      <section className="stats-bar" aria-label="Summary">
        <div className="stat-card">
          <span className="stat-label">Weekly XP</span>
          <span className="stat-value">{seasonSummary.current.xp}</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-label">League</span>
          <span className="stat-value stat-value-word">{seasonSummary.rank.current.name}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Live streak</span>
          <span className="stat-value">{seasonSummary.current.liveStreak}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Beat last week</span>
          <span className={`stat-value ${seasonSummary.duel.state === 'ahead' ? 'is-positive' : seasonSummary.duel.state === 'behind' ? 'is-negative' : ''}`}>
            {seasonSummary.duel.deltaXp > 0 ? '+' : ''}{seasonSummary.duel.deltaXp}
          </span>
        </div>
      </section>

      <section className="overall-progress-section">
        <div className="overall-progress-heading">
          <p className="section-eyebrow">Overview</p>
          <h2 className="overall-progress-title">The week at a glance</h2>
        </div>
        <div className="overall-progress-content">
          <div className="overall-progress-charts">
            <div className="overall-progress-bar-wrap">
              <WeeklyBarChartSimple
                dataPoints={weekDailyCounts}
                maxValue={Math.max(1, ...weekDailyCounts, habits.length)}
                height={96}
              />
            </div>
            <div className="overall-progress-donut-wrap">
              <DonutChart
                completed={weekCompletedCount}
                total={weekTotalPossible}
                size={132}
                label="Completed"
              />
            </div>
          </div>
          <div className="overall-progress-footer">
            <p className="overall-progress-quote">&ldquo;{motivationalQuote}&rdquo;</p>
            <p className="overall-progress-week-start">Week of {startOfWeekDate}</p>
          </div>
        </div>
      </section>

      <section className="composer" aria-label="Add habit">
        <input
          ref={composerInputRef}
          type="text"
          placeholder="What habit will you build next?"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addHabit()}
          className="composer-input"
          aria-label="New habit name"
        />
        <div className="composer-row">
          <div className="composer-chips" role="radiogroup" aria-label="Weekly goal">
            {[
              { value: '', label: 'No goal' },
              { value: '3', label: '3×' },
              { value: '4', label: '4×' },
              { value: '5', label: '5×' },
              { value: '6', label: '6×' },
              { value: '7', label: 'Daily' },
            ].map((opt) => (
              <button
                key={opt.value || 'none'}
                type="button"
                role="radio"
                aria-checked={newHabitGoal === opt.value}
                className={`composer-chip ${newHabitGoal === opt.value ? 'active' : ''}`}
                onClick={() => setNewHabitGoal(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={addHabit}
            className={`composer-submit ${newHabitName.trim() ? '' : 'is-idle'}`}
            aria-disabled={!newHabitName.trim()}
          >
            Add habit
          </button>
        </div>
      </section>

      {todaysPlannedHabits.length > 0 && (
        <section className="if-then-section">
          <div className="if-then-header">
            <h2>Today&apos;s cues</h2>
            <p className="if-then-subtitle">For habits still pending, follow your saved if-then action.</p>
          </div>
          <div className="if-then-list">
            {todaysPlannedHabits.map((habit) => {
              const plan = ifThenPlans[habit.id]
              return (
                <div key={habit.id} className="if-then-card">
                  <span className="if-then-card-habit">{habit.name}</span>
                  <p className="if-then-card-plan">
                    <strong>If</strong> {plan.cue}, <strong>then</strong> {plan.action}.
                  </p>
                  <button type="button" className="btn-sm" onClick={() => toggleCompletion(habit.id, today)}>
                    Mark done
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="tracker-section">
        <div className="tracker-header">
          <div className="section-heading">
            <p className="section-eyebrow">Habits</p>
            <h2>Daily tracker</h2>
          </div>
          <div className="view-toggle">
            <button
              type="button"
              className={viewDays === 7 ? 'active' : ''}
              onClick={() => setViewDays(7)}
            >
              This week
            </button>
            <button
              type="button"
              className={viewDays === 14 ? 'active' : ''}
              onClick={() => setViewDays(14)}
            >
              2 weeks
            </button>
          </div>
        </div>

        <div className="tracker-grid-wrap">
          <div className="tracker-grid tracker-grid-with-progress" style={{ '--days': viewDays }}>
            <div className="grid-row header-row">
              <div className="cell habit-label">Habit</div>
              {days.map((d) => {
                const [y, m, day] = d.split('-').map(Number)
                const dateObj = new Date(y, m - 1, day)
                const fullLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                const shortWeekday = dateObj.toLocaleDateString(undefined, { weekday: 'narrow' })
                return (
                  <div key={d} className={`cell day-cell ${d === today ? 'today' : ''}`} title={fullLabel}>
                    <span className="day-label-full">{fullLabel}</span>
                    <span className="day-label-short">
                      <span className="day-label-weekday">{shortWeekday}</span>
                      <span className="day-label-date">{day}</span>
                    </span>
                  </div>
                )
              })}
              <div className="cell cell-progress-header">Progress</div>
            </div>
            {habits.length > 0 && (
              <div className="grid-row daily-pct-row">
                <div className="cell habit-label daily-pct-label">Daily %</div>
                {days.map((d, i) => (
                  <div key={d} className={`cell day-cell daily-pct-cell ${d === today ? 'today' : ''}`}>
                    {dailyCompletionPcts[i]}%
                  </div>
                ))}
                <div className="cell cell-progress-header" />
              </div>
            )}
            {habits.length === 0 ? (
              <div className="empty-state">
                <p>No habits yet. Add one above to start tracking.</p>
              </div>
            ) : (
              habits.map((habit) => {
                const weeklyCount = getWeeklyCount(completionDatesByHabit[habit.id] || [], 7)
                const habitWeeklyXp = weeklyCount * 18 + ((habit.goal != null && weeklyCount >= habit.goal) ? 40 : 0)
                const progressMax = 7
                return (
                <div key={habit.id} className="grid-row habit-row">
                  <div className="cell habit-cell">
                    {editingId === habit.id ? (
                      <div className="edit-inline">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateHabit(habit.id, editName, editGoal || undefined)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <select
                          className="edit-goal-select"
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                        >
                          <option value="">No goal</option>
                          <option value="3">3×/week</option>
                          <option value="4">4×/week</option>
                          <option value="5">5×/week</option>
                          <option value="6">6×/week</option>
                          <option value="7">Every day</option>
                        </select>
                        <button type="button" onClick={() => updateHabit(habit.id, editName, editGoal || undefined)} className="btn-sm">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="btn-sm ghost">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="habit-name-wrap">
                        <span className="habit-name">{habit.name}</span>
                        <span className="habit-xp-badge">+{habitWeeklyXp} XP</span>
                        {habit.goal != null && (
                          <span className={`goal-badge ${getWeeklyCount(completionDatesByHabit[habit.id] || [], 7) >= habit.goal ? 'met' : ''}`}>
                            {getWeeklyCount(completionDatesByHabit[habit.id] || [], 7)}/{habit.goal} this week
                          </span>
                        )}
                        <span className="streak-badge">
                          <FlameIcon size={14} /> {getStreak(completionDatesByHabit[habit.id] || [])} day streak
                        </span>
                        <div className="plan-wrap">
                          <button
                            type="button"
                            className={`icon-btn plan-btn ${(ifThenPlans[habit.id]?.cue && ifThenPlans[habit.id]?.action) ? 'on' : ''}`}
                            onClick={() => (planOpenId === habit.id ? setPlanOpenId(null) : openPlanPopover(habit.id))}
                            title={(ifThenPlans[habit.id]?.cue && ifThenPlans[habit.id]?.action) ? `If ${ifThenPlans[habit.id].cue}, then ${ifThenPlans[habit.id].action}` : 'Set If-Then plan'}
                            aria-label="Set if-then plan"
                          >
                            <TargetIcon size={16} />
                          </button>
                          {(ifThenPlans[habit.id]?.cue && ifThenPlans[habit.id]?.action) && (
                            <span className="plan-label">
                              If {ifThenPlans[habit.id].cue}, then {ifThenPlans[habit.id].action}
                            </span>
                          )}
                          {planOpenId === habit.id && (
                            <div className="plan-popover">
                              <span className="reminder-popover-title">If-Then plan</span>
                              <p className="reminder-popover-hint">Make it specific: If [cue], then [small action].</p>
                              <label className="reminder-popover-label">If (cue)</label>
                              <input
                                type="text"
                                value={planCueInput}
                                onChange={(e) => setPlanCueInput(e.target.value)}
                                className="plan-text-input"
                                placeholder="After dinner at 8 PM"
                              />
                              <label className="reminder-popover-label">Then (action)</label>
                              <input
                                type="text"
                                value={planActionInput}
                                onChange={(e) => setPlanActionInput(e.target.value)}
                                className="plan-text-input"
                                placeholder="Read for 10 minutes"
                              />
                              <div className="reminder-popover-actions">
                                <button type="button" className="btn-sm" onClick={() => setIfThenPlan(habit.id, planCueInput, planActionInput)}>
                                  Save
                                </button>
                                <button type="button" className="btn-sm ghost" onClick={() => setIfThenPlan(habit.id, '', '')}>
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="icon-btn edit"
                          onClick={() => {
                            setEditingId(habit.id)
                            setEditName(habit.name)
                            setEditGoal(habit.goal ? String(habit.goal) : '')
                          }}
                          aria-label="Edit"
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => deleteHabit(habit.id)}
                          aria-label="Delete"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {days.map((day) => (
                    <div key={day} className={`cell day-cell check-cell ${day === today ? 'today' : ''}`}>
                      <button
                        type="button"
                        className={`check-btn ${isCompleted(habit.id, day) ? 'checked' : ''}`}
                        onClick={() => toggleCompletion(habit.id, day)}
                        aria-label={`${isCompleted(habit.id, day) ? 'Unmark' : 'Mark'} ${habit.name} for ${day}`}
                      >
                        {isCompleted(habit.id, day) ? <CheckIcon size={14} /> : ''}
                      </button>
                    </div>
                  ))}
                  <div className="cell cell-progress">
                    <div className="habit-progress-bar" title={`${weeklyCount}/${progressMax}`}>
                      <div className="habit-progress-fill" style={{ width: `${(weeklyCount / progressMax) * 100}%` }} />
                    </div>
                    <span className="habit-progress-text">{weeklyCount}/7</span>
                  </div>
                </div>
              )
              })
            )}
          </div>
        </div>
        {habits.length > 0 && dailyCompletionPcts.length > 0 && (
          <OverallProgressChart dataPoints={dailyCompletionPcts} height={56} />
        )}
      </section>

      <section className="daily-columns-section">
        <div className="section-heading">
          <p className="section-eyebrow">Week view</p>
          <h2 className="daily-columns-title">This week</h2>
        </div>
        <div className="daily-columns">
          {weekDates.map((d) => {
            const dayTasks = getTasksForDay(d)
            const habitsDone = habits.filter(
              (h) => isCompleted(h.id, d) || ((timeSpent[h.id] || {})[d] || 0) > 0
            ).length
            const tasksDone = dayTasks.filter((t) => t.completed).length
            const dayCompleted = habitsDone + tasksDone
            const dayTotal = habits.length + dayTasks.length || 1
            const [y, m, dayNum] = d.split('-').map(Number)
            const dayName = new Date(y, m - 1, dayNum).toLocaleDateString(undefined, { weekday: 'long' })
            const dateStr = new Date(y, m - 1, dayNum).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
            return (
              <div key={d} className={`daily-column ${d === today ? 'today' : ''}`}>
                <div className="daily-column-header">
                  <span className="daily-column-day">{dayName}</span>
                  <span className="daily-column-date">{dateStr}</span>
                </div>
                <div className="daily-column-donut">
                  <DonutChart
                    completed={dayCompleted}
                    total={dayTotal}
                    size={72}
                    label="Done"
                  />
                </div>
                <div className="daily-column-tasks">
                  <span className="daily-column-tasks-title">Tasks</span>
                  <DailyTasksList
                    dateKey={d}
                    tasks={dayTasks}
                    onToggle={toggleTask}
                    onRemove={removeTask}
                    onAdd={addTask}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <AchievementsPanel
        habits={habits}
        completions={completions}
        timeSpent={timeSpent}
        tasks={tasks}
        completionTimes={completionTimes}
        focusMinutes={focusMin}
      />

      <section className="calendar-section">
        <button
          type="button"
          className="calendar-dropdown-header"
          onClick={() => setCalendarOpen((o) => !o)}
          aria-expanded={calendarOpen}
        >
          <span className="calendar-dropdown-title">Calendar</span>
          <span className="calendar-dropdown-chevron" aria-hidden>{calendarOpen ? '▼' : '▶'}</span>
        </button>
        {calendarOpen && (
          <div className="calendar-dropdown-content">
            <p className="calendar-intro">Click any day to manage tasks. Select a habit to also mark completions.</p>
            <CalendarView
              year={calendarMonth.year}
              month={calendarMonth.month}
              onPrevMonth={() =>
                setCalendarMonth((prev) => {
                  const d = new Date(prev.year, prev.month - 1, 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })
              }
              onNextMonth={() =>
                setCalendarMonth((prev) => {
                  const d = new Date(prev.year, prev.month + 1, 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })
              }
              onGoToToday={() => {
                const d = new Date()
                setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() })
                setCalendarTaskDate(todayKey())
              }}
              habits={habits}
              completions={completions}
              selectedHabitId={calendarHabitId}
              onSelectHabit={setCalendarHabitId}
              selectedDateKey={calendarTaskDate}
              onSelectDate={setCalendarTaskDate}
              taskCounts={calendarTaskCounts}
              today={today}
              onToggleDay={toggleCompletion}
            />
            <div className="calendar-tasks-panel">
              <div className="calendar-tasks-header">
                <span className="calendar-tasks-title">Tasks for</span>
                <span className="calendar-tasks-date">{selectedCalendarTaskDateLabel}</span>
              </div>
              <DailyTasksList
                dateKey={calendarTaskDate}
                tasks={getTasksForDay(calendarTaskDate)}
                onToggle={toggleTask}
                onRemove={removeTask}
                onAdd={addTask}
              />
            </div>
          </div>
        )}
      </section>

      <footer className="footer">
        <p>Let the tracker guide you toward your best version of yourself.</p>
      </footer>
    </div>
  )
}

export default Tracker
