const REMINDERS_KEY = 'habitloop_reminders'
const NOTIFY_LOOKBACK_MS = 10 * 60 * 1000

function load() {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY)
    return raw ? JSON.parse(raw) : { times: {}, lastNotified: {}, lastCheckedAt: 0 }
  } catch {
    return { times: {}, lastNotified: {}, lastCheckedAt: 0 }
  }
}

/** Normalize to { remindAt, start, end }. Legacy: string -> start only; { start, end } -> add remindAt null. */
function normalizeEntry(value) {
  if (value == null) return null
  if (typeof value === 'string') return { remindAt: null, start: value, end: null }
  return {
    remindAt: value.remindAt ?? null,
    start: value.start ?? null,
    end: value.end ?? null,
  }
}

export function getReminderTimes() {
  const data = load()
  const times = data.times || {}
  const out = {}
  Object.keys(times).forEach((habitId) => {
    const entry = normalizeEntry(times[habitId])
    if (entry && (entry.remindAt || entry.start || entry.end)) out[habitId] = entry
  })
  return out
}

export function saveReminderTimes(times) {
  const data = load()
  data.times = times
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(data))
}

function saveLastNotified(key, dateKey) {
  const data = load()
  data.lastNotified = data.lastNotified || {}
  data.lastNotified[key] = dateKey
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(data))
}

function getLastNotified(key) {
  return load().lastNotified?.[key] || null
}

function getLastCheckedAt() {
  const value = Number(load().lastCheckedAt)
  return Number.isFinite(value) ? value : 0
}

function saveLastCheckedAt(timestamp) {
  const data = load()
  data.lastCheckedAt = timestamp
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(data))
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  return Notification.requestPermission()
}

/** Add minutes to "HH:mm"; delta can be negative. */
function addMinutesToHM(hm, delta) {
  const [h, m] = hm.split(':').map(Number)
  let total = h * 60 + m + delta
  total = ((total % 1440) + 1440) % 1440
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function toTodayTimestamp(hm, now) {
  const [h, m] = hm.split(':').map(Number)
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h || 0,
    m || 0,
    0,
    0
  ).getTime()
}

function shouldNotifyInWindow(hm, windowStartMs, nowMs, nowDate) {
  if (!hm) return false
  const scheduledMs = toTodayTimestamp(hm, nowDate)
  return scheduledMs > windowStartMs && scheduledMs <= nowMs
}

/** Call periodically (e.g. every 30s). Remind + Start + End (5 min, 1 min, over).
 *  If isCompletedToday(habitId) is true, end-time warnings are skipped for that habit (task already done).
 */
export function checkAndNotify(habits, reminderTimes, isCompletedToday) {
  if (!habits?.length || !reminderTimes) return

  const now = new Date()
  const nowMs = now.getTime()
  const lastCheckedAt = getLastCheckedAt()
  const windowStartMs = lastCheckedAt > 0 ? Math.max(lastCheckedAt, nowMs - NOTIFY_LOOKBACK_MS) : nowMs - 60_000
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const notificationsEnabled = 'Notification' in window && Notification.permission === 'granted'

  if (!notificationsEnabled) {
    saveLastCheckedAt(nowMs)
    return
  }

  habits.forEach((habit) => {
    const entry = reminderTimes[habit.id]
    if (!entry) return

    const remindKey = `${habit.id}_remind`
    const startKey = `${habit.id}_start`
    const end5Key = `${habit.id}_end5`
    const end1Key = `${habit.id}_end1`
    const endKey = `${habit.id}_end`

    // Remind: separate notification system — "Reminder: {habit}" at remindAt time only
    if (
      entry.remindAt &&
      getLastNotified(remindKey) !== today &&
      shouldNotifyInWindow(entry.remindAt, windowStartMs, nowMs, now)
    ) {
      try {
        new Notification('Dailo', {
          body: `Reminder: ${habit.name}`,
          icon: '/favicon.svg',
        })
        saveLastNotified(remindKey, today)
      } catch (_) {}
    }

    // Start time: "Time for: {habit}"
    if (
      entry.start &&
      getLastNotified(startKey) !== today &&
      shouldNotifyInWindow(entry.start, windowStartMs, nowMs, now)
    ) {
      try {
        new Notification('Dailo', {
          body: `Time for: ${habit.name}`,
          icon: '/favicon.svg',
        })
        saveLastNotified(startKey, today)
      } catch (_) {}
    }

    // End time warnings — skip if user already marked this habit done today
    const endHM = entry.end
    if (!endHM) return
    if (typeof isCompletedToday === 'function' && isCompletedToday(habit.id)) return

    const end5HM = addMinutesToHM(endHM, -5)
    const end1HM = addMinutesToHM(endHM, -1)

    if (
      getLastNotified(end5Key) !== today &&
      shouldNotifyInWindow(end5HM, windowStartMs, nowMs, now)
    ) {
      try {
        new Notification('Dailo', {
          body: `First warning: ${habit.name} ends in 5 minutes`,
          icon: '/favicon.svg',
        })
        saveLastNotified(end5Key, today)
      } catch (_) {}
    }
    if (
      getLastNotified(end1Key) !== today &&
      shouldNotifyInWindow(end1HM, windowStartMs, nowMs, now)
    ) {
      try {
        new Notification('Dailo', {
          body: `Final warning: ${habit.name} ends in 1 minute`,
          icon: '/favicon.svg',
        })
        saveLastNotified(end1Key, today)
      } catch (_) {}
    }
    if (
      getLastNotified(endKey) !== today &&
      shouldNotifyInWindow(endHM, windowStartMs, nowMs, now)
    ) {
      try {
        new Notification('Dailo', {
          body: `${habit.name} time is over`,
          icon: '/favicon.svg',
        })
        saveLastNotified(endKey, today)
      } catch (_) {}
    }
  })

  saveLastCheckedAt(nowMs)
}

/** Format "07:00" -> "7:00 AM", "13:30" -> "1:30 PM" */
export function formatReminderTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const hour = h % 12 || 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}
