const HABITS_KEY = 'habitloop_habits'
const COMPLETIONS_KEY = 'habitloop_completions'
const TIME_SPENT_KEY = 'habitloop_time'
const TASKS_KEY = 'habitloop_tasks'
const COMPLETION_TIMES_KEY = 'habitloop_completion_times'

export function getHabits() {
  try {
    const raw = localStorage.getItem(HABITS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits))
}

export function getCompletions() {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCompletions(completions) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions))
}

export function getTimeSpent() {
  try {
    const raw = localStorage.getItem(TIME_SPENT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveTimeSpent(timeSpent) {
  localStorage.setItem(TIME_SPENT_KEY, JSON.stringify(timeSpent))
}

/** Daily tasks: { [dateKey]: [{ id, label, completed }] } */
export function getTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

/** When user marked habit complete: { habitId: { dateKey: "ISO timestamp" } } */
export function getCompletionTimes() {
  try {
    const raw = localStorage.getItem(COMPLETION_TIMES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCompletionTimes(times) {
  localStorage.setItem(COMPLETION_TIMES_KEY, JSON.stringify(times))
}

/** Add minutes to a habit for a given day. Returns updated time for that day. */
export function addTimeForDay(timeSpent, habitId, dateKey, minutesToAdd) {
  const byHabit = timeSpent[habitId] || {}
  const current = byHabit[dateKey] || 0
  const next = { ...timeSpent, [habitId]: { ...byHabit, [dateKey]: current + minutesToAdd } }
  return next
}

/** Format a date as YYYY-MM-DD in the user's local timezone (not UTC). */
function toLocalDateString(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's date in the user's local timezone (YYYY-MM-DD). */
export function todayKey() {
  return toLocalDateString(new Date())
}

/** Date key for storage/comparison; uses local timezone. */
export function dateKey(d) {
  if (typeof d === 'string') return d
  return toLocalDateString(new Date(d))
}

export function getDaysAroundToday(count = 14) {
  const today = new Date()
  const out = []
  for (let i = -count + 1; i <= 0; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    out.push(dateKey(d))
  }
  return out
}

/** Monday = first day of week (ISO). Returns 7 date keys for the week that contains the given date (default today). */
function getMondayOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const daysFromMonday = (day + 6) % 7
  d.setDate(d.getDate() - daysFromMonday)
  return d
}

/** Current calendar week: Mon–Sun (7 date keys). Resets each week to real-world week. */
export function getCurrentWeekDates() {
  const monday = getMondayOfWeek()
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    out.push(dateKey(d))
  }
  return out
}

/** Previous week (Mon–Sun) + current week (Mon–Sun) = 14 date keys. */
export function getTwoWeeksDates() {
  const thisMonday = getMondayOfWeek()
  const prevMonday = new Date(thisMonday)
  prevMonday.setDate(prevMonday.getDate() - 7)
  const out = []
  for (let w = 0; w < 2; w++) {
    const start = w === 0 ? prevMonday : thisMonday
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      out.push(dateKey(d))
    }
  }
  return out
}

/** Minutes per day for the current week (Mon–Sun), same order as getCurrentWeekDates. */
export function getWeeklyTimeMinutes(timeSpent, habitId) {
  const dates = getCurrentWeekDates()
  const byHabit = timeSpent[habitId] || {}
  return dates.map((d) => byHabit[d] || 0)
}

/** Calendar grid for a month: 6 weeks × 7 days (Mon–Sun). Each cell: { dateKey, day, isCurrentMonth }. Uses local timezone. */
export function getCalendarGrid(year, month) {
  const first = new Date(year, month, 1)
  const monday = getMondayOfWeek(first)
  const grid = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const y = d.getFullYear()
    const m = d.getMonth()
    grid.push({
      dateKey: dateKey(d),
      day: d.getDate(),
      isCurrentMonth: y === year && m === month,
    })
  }
  return grid
}
