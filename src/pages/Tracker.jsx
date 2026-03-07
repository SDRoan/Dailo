import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getHabits, saveHabits, getCompletions, saveCompletions, getTimeSpent, saveTimeSpent, addTimeForDay, getTasks, saveTasks, getCompletionTimes, saveCompletionTimes, getIfThenPlans, saveIfThenPlans, todayKey, getCurrentWeekDates, getTwoWeeksDates } from '../lib/storage'
import { getStreak, getCompletionRate, getWeeklyCount } from '../lib/streaks'
import { getReminderTimes, saveReminderTimes, requestNotificationPermission, checkAndNotify, formatReminderTime } from '../lib/reminders'
import CalendarView from '../components/CalendarView'
import OverallProgressChart from '../components/OverallProgressChart'
import DonutChart from '../components/DonutChart'
import WeeklyBarChartSimple from '../components/WeeklyBarChartSimple'
import DailyTasksList from '../components/DailyTasksList'
import FocusTimer from '../components/FocusTimer'

function Tracker() {
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
  const [reminderRemindAtInput, setReminderRemindAtInput] = useState('')
  const [reminderTimeInput, setReminderTimeInput] = useState('')
  const [reminderEndTimeInput, setReminderEndTimeInput] = useState('')
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

  useEffect(() => {
    setHabits(getHabits())
    setCompletions(getCompletions())
    setReminders(getReminderTimes())
    setTimeSpent(getTimeSpent())
    setTasks(getTasks())
    setCompletionTimes(getCompletionTimes())
    setIfThenPlans(getIfThenPlans())
  }, [])

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
    if (!name) return
    const id = crypto.randomUUID()
    const goal = newHabitGoal ? Number(newHabitGoal) : undefined
    persistHabits([...habits, { id, name, createdAt: new Date().toISOString(), goal }])
    setNewHabitName('')
    setNewHabitGoal('')
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

  const setReminder = (habitId, remindAt, start, end) => {
    if (!remindAt && !start && !end) {
      const next = { ...reminders }
      delete next[habitId]
      setReminders(next)
      saveReminderTimes(next)
    } else {
      const next = {
        ...reminders,
        [habitId]: {
          remindAt: remindAt || null,
          start: start || null,
          end: end || null,
        },
      }
      setReminders(next)
      saveReminderTimes(next)
      if (remindAt || start || end) requestNotificationPermission()
    }
    setReminderOpenId(null)
    setReminderRemindAtInput('')
    setReminderTimeInput('')
    setReminderEndTimeInput('')
  }

  const openReminderPopover = (habitId) => {
    setReminderOpenId(habitId)
    setPlanOpenId(null)
    const entry = reminders[habitId]
    setReminderRemindAtInput(entry?.remindAt || '')
    setReminderTimeInput(entry?.start || '09:00')
    setReminderEndTimeInput(entry?.end || '')
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

  const overallCompletionRate =
    habits.length === 0
      ? 0
      : Math.round(
          habits.reduce((sum, h) => sum + getCompletionRate(completionDatesByHabit[h.id] || [], 7), 0) / habits.length
        )

  const totalStreak = habits.reduce((sum, h) => sum + getStreak(completionDatesByHabit[h.id] || []), 0)

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

  const hmToMinutes = (hm) => {
    if (!hm) return 0
    const [h, m] = hm.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const plannedDurationMinutes = (startHM, endHM) => {
    if (!startHM || !endHM) return null
    const diff = hmToMinutes(endHM) - hmToMinutes(startHM)
    return diff <= 0 ? null : diff
  }
  const workedMinutesForDay = (habitId, dayKey, startHM) => {
    const iso = completionTimes[habitId]?.[dayKey]
    if (!iso || !startHM) return null
    const [y, mo, d] = dayKey.split('-').map(Number)
    const [h, m] = startHM.split(':').map(Number)
    const startDate = new Date(y, mo - 1, d, h || 0, m || 0)
    const completedDate = new Date(iso)
    const ms = completedDate - startDate
    if (ms < 0) return null
    return Math.round(ms / 60000)
  }
  const formatDurationMin = (min) => {
    if (min == null || min < 0) return ''
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }

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

  return (
    <div className="app">
      <nav className="app-nav">
        <Link to="/" className="app-nav-back">← Home</Link>
        <button
          type="button"
          className="focus-timer-trigger"
          onClick={() => setFocusOpen(true)}
        >
          Focus
        </button>
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
      <header className="header">
        <h1 className="logo">Dailo</h1>
        <p className="tagline">Track your habits and progress effortlessly</p>
      </header>

      <section className="stats-bar">
        <div className="stat-card">
          <span className="stat-value">{overallCompletionRate}%</span>
          <span className="stat-label">7-day consistency</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-value">{totalStreak}</span>
          <span className="stat-label">Total streak days</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{habits.length}</span>
          <span className="stat-label">Habits tracked</span>
        </div>
      </section>

      <section className="overall-progress-section">
        <h2 className="overall-progress-title">Overall Progress</h2>
        <div className="overall-progress-content">
          <div className="overall-progress-charts">
            <div className="overall-progress-bar-wrap">
              <WeeklyBarChartSimple
                dataPoints={weekDailyCounts}
                maxValue={Math.max(1, ...weekDailyCounts, habits.length)}
                height={80}
              />
            </div>
            <div className="overall-progress-donut-wrap">
              <DonutChart
                completed={weekCompletedCount}
                total={weekTotalPossible}
                size={100}
                label="Completed"
              />
            </div>
          </div>
          <p className="overall-progress-quote">{motivationalQuote}</p>
          <p className="overall-progress-week-start">Start of the week: {startOfWeekDate}</p>
        </div>
      </section>

      <section className="add-habit">
        <input
          type="text"
          placeholder="Add a new habit (e.g. Morning run, Read 20 min)"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addHabit()}
          className="add-input"
        />
        <select
          className="add-goal-select"
          value={newHabitGoal}
          onChange={(e) => setNewHabitGoal(e.target.value)}
          title="Weekly goal (optional)"
        >
          <option value="">No goal</option>
          <option value="3">3× per week</option>
          <option value="4">4× per week</option>
          <option value="5">5× per week</option>
          <option value="6">6× per week</option>
          <option value="7">Every day</option>
        </select>
        <button type="button" onClick={addHabit} className="btn btn-primary">
          Add habit
        </button>
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
          <h2>Daily tracker</h2>
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
                const label = new Date(y, m - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                return (
                  <div key={d} className={`cell day-cell ${d === today ? 'today' : ''}`} title={d}>
                    {label}
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
                        {habit.goal != null && (
                          <span className={`goal-badge ${getWeeklyCount(completionDatesByHabit[habit.id] || [], 7) >= habit.goal ? 'met' : ''}`}>
                            {getWeeklyCount(completionDatesByHabit[habit.id] || [], 7)}/{habit.goal} this week
                          </span>
                        )}
                        <span className="streak-badge">
                          🔥 {getStreak(completionDatesByHabit[habit.id] || [])} day streak
                        </span>
                        <div className="reminder-wrap">
                          <button
                            type="button"
                            className={`icon-btn reminder-btn ${(reminders[habit.id]?.remindAt || reminders[habit.id]?.start) ? 'on' : ''}`}
                            onClick={() => (reminderOpenId === habit.id ? setReminderOpenId(null) : openReminderPopover(habit.id))}
                            title={reminders[habit.id]?.remindAt || reminders[habit.id]?.start ? [
                              reminders[habit.id].remindAt && `Remind ${formatReminderTime(reminders[habit.id].remindAt)}`,
                              reminders[habit.id].start && `Start ${formatReminderTime(reminders[habit.id].start)}`,
                              reminders[habit.id].end && `End ${formatReminderTime(reminders[habit.id].end)}`,
                            ].filter(Boolean).join(' · ') : 'Set Remind, Start & End'}
                            aria-label="Set reminder"
                          >
                            🔔
                          </button>
                          {(reminders[habit.id]?.remindAt || reminders[habit.id]?.start) && (
                            <span className="reminder-label">
                              {reminders[habit.id].remindAt && `Remind ${formatReminderTime(reminders[habit.id].remindAt)}`}
                              {reminders[habit.id].remindAt && (reminders[habit.id].start || reminders[habit.id].end) && ' · '}
                              {reminders[habit.id].start && formatReminderTime(reminders[habit.id].start)}
                              {reminders[habit.id].start && reminders[habit.id].end && ` – ${formatReminderTime(reminders[habit.id].end)}`}
                            </span>
                          )}
                          {reminders[habit.id]?.start && reminders[habit.id]?.end && (
                            <span className="duration-badge planned" title="Planned duration">
                              {formatDurationMin(plannedDurationMinutes(reminders[habit.id].start, reminders[habit.id].end))} planned
                            </span>
                          )}
                          {reminders[habit.id]?.start && isCompleted(habit.id, today) && workedMinutesForDay(habit.id, today, reminders[habit.id].start) != null && (
                            <span className="duration-badge worked" title="How long you worked today">
                              Worked {formatDurationMin(workedMinutesForDay(habit.id, today, reminders[habit.id].start))}
                              {plannedDurationMinutes(reminders[habit.id].start, reminders[habit.id].end) != null &&
                                workedMinutesForDay(habit.id, today, reminders[habit.id].start) < plannedDurationMinutes(reminders[habit.id].start, reminders[habit.id].end) &&
                                ` (${formatDurationMin(plannedDurationMinutes(reminders[habit.id].start, reminders[habit.id].end) - workedMinutesForDay(habit.id, today, reminders[habit.id].start))} early)`}
                            </span>
                          )}
                          {reminderOpenId === habit.id && (
                            <div className="reminder-popover">
                              <span className="reminder-popover-title">Remind</span>
                              <label className="reminder-popover-label">Remind at</label>
                              <input
                                type="time"
                                value={reminderRemindAtInput}
                                onChange={(e) => setReminderRemindAtInput(e.target.value)}
                                className="reminder-time-input"
                              />
                              <label className="reminder-popover-label">Start</label>
                              <input
                                type="time"
                                value={reminderTimeInput}
                                onChange={(e) => setReminderTimeInput(e.target.value)}
                                className="reminder-time-input"
                              />
                              <label className="reminder-popover-label">End</label>
                              <input
                                type="time"
                                value={reminderEndTimeInput}
                                onChange={(e) => setReminderEndTimeInput(e.target.value)}
                                className="reminder-time-input"
                              />
                              <div className="reminder-popover-actions">
                                <button type="button" className="btn-sm" onClick={() => setReminder(habit.id, reminderRemindAtInput || null, reminderTimeInput || null, reminderEndTimeInput || null)}>
                                  Save
                                </button>
                                <button type="button" className="btn-sm ghost" onClick={() => setReminder(habit.id, null, null, null)}>
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="plan-wrap">
                          <button
                            type="button"
                            className={`icon-btn plan-btn ${(ifThenPlans[habit.id]?.cue && ifThenPlans[habit.id]?.action) ? 'on' : ''}`}
                            onClick={() => (planOpenId === habit.id ? setPlanOpenId(null) : openPlanPopover(habit.id))}
                            title={(ifThenPlans[habit.id]?.cue && ifThenPlans[habit.id]?.action) ? `If ${ifThenPlans[habit.id].cue}, then ${ifThenPlans[habit.id].action}` : 'Set If-Then plan'}
                            aria-label="Set if-then plan"
                          >
                            🎯
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
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => deleteHabit(habit.id)}
                          aria-label="Delete"
                        >
                          🗑️
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
                        {isCompleted(habit.id, day) ? '✓' : ''}
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
        <h2 className="daily-columns-title">This week</h2>
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
