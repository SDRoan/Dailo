import { dateKey } from './storage'

export function getStreak(completionDates) {
  if (!Array.isArray(completionDates) || completionDates.length === 0) return 0
  const sorted = [...completionDates].sort().reverse()
  const today = dateKey(new Date())
  let streak = 0
  let check = today
  for (const d of sorted) {
    if (d === check) {
      streak++
      const next = new Date(check)
      next.setDate(next.getDate() - 1)
      check = dateKey(next)
    } else if (d < check) {
      break
    }
  }
  return streak
}

export function getCompletionRate(completionDates, days = 7) {
  if (!Array.isArray(completionDates) || days < 1) return 0
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  let completed = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (completionDates.includes(dateKey(d))) completed++
  }
  return Math.round((completed / days) * 100)
}

/** Number of completed days in the last `days` days (e.g. this week). */
export function getWeeklyCount(completionDates, days = 7) {
  if (!Array.isArray(completionDates) || days < 1) return 0
  const set = new Set(completionDates)
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  let count = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (set.has(dateKey(d))) count++
  }
  return count
}

/** Returns array of 0|1 for each day (oldest to newest) for the last `days` days. */
export function getWeeklyDataPoints(completionDates, days = 7) {
  const set = new Set(Array.isArray(completionDates) ? completionDates : [])
  const out = []
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(set.has(dateKey(d)) ? 1 : 0)
  }
  return out
}
